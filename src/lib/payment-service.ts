import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  SubscriptionPlanType,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscription-config'

export interface PaymentResult {
  success: boolean
  error?: string
  subscriptionId?: string
  purchaseId?: string
  redirectUrl?: string
}

export interface SubscriptionCreationData {
  userId: string
  userEmail: string
  planType: SubscriptionPlanType
  billingInterval: 'monthly' | 'yearly'
  paymentProvider: 'stripe' | 'paypal'
  externalSubscriptionId?: string
  customerId?: string
}

export interface PurchaseCreationData {
  userId?: string
  imageId: string
  licenseType: string
  amount: number
  currency: string
  paymentProvider: 'stripe' | 'paypal'
  externalPaymentId: string
  externalOrderId?: string
}

/**
 * Unified Payment Service
 * Handles subscription and purchase creation across different payment providers
 */
export class PaymentService {
  /**
   * Create a subscription record in the database
   */
  async createSubscription(
    data: SubscriptionCreationData
  ): Promise<PaymentResult> {
    try {
      // Use service role client for webhook operations to bypass RLS
      const supabase = createServiceRoleClient()
      console.log(
        `🔍 Service role key being used:`,
        process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
      )

      const plan = SUBSCRIPTION_PLANS[data.planType]
      if (!plan) {
        return { success: false, error: `Invalid plan type: ${data.planType}` }
      }

      // Calculate period end
      const currentPeriodEnd = new Date()
      if (data.billingInterval === 'monthly') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
      } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
      }

      // Create subscription record
      const subscriptionData = {
        user_id: data.userId,
        plan_type: data.planType,
        price_monthly: plan.priceMonthly,
        price_yearly: plan.priceYearly,
        status: 'active' as const,
        billing_interval: data.billingInterval,
        payment_provider: data.paymentProvider,
        stripe_subscription_id:
          data.paymentProvider === 'stripe'
            ? data.externalSubscriptionId
            : null,
        paypal_subscription_id:
          data.paymentProvider === 'paypal'
            ? data.externalSubscriptionId
            : null,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        features: plan.features,
      }

      console.log(
        `🔍 Attempting to create subscription with data:`,
        subscriptionData
      )

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', data.userId)
        .single()

      let subscription, error

      if (existingSubscription) {
        console.log(
          `🔄 Updating existing subscription for user: ${data.userId}`
        )
        // Update existing subscription
        const result = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('user_id', data.userId)
          .select()
          .single()

        subscription = result.data
        error = result.error
      } else {
        console.log(`➕ Creating new subscription for user: ${data.userId}`)
        // Create new subscription using raw SQL to bypass RLS
        try {
          const { data: insertResult, error: insertError } = await supabase.rpc(
            'create_subscription_webhook',
            {
              p_user_id: data.userId,
              p_plan_type: data.planType,
              p_price_monthly: plan.priceMonthly,
              p_price_yearly: plan.priceYearly,
              p_status: 'active',
              p_billing_interval: data.billingInterval,
              p_stripe_subscription_id: data.externalSubscriptionId,
              p_current_period_start: subscriptionData.current_period_start,
              p_current_period_end: subscriptionData.current_period_end,
              p_features: JSON.stringify(plan.features),
            }
          )

          if (insertError) {
            console.log(
              `⚠️ RPC function not available, trying direct insert:`,
              insertError
            )
            // Fallback to direct insert
            const result = await supabase
              .from('subscriptions')
              .insert(subscriptionData)
              .select()
              .single()

            subscription = result.data
            error = result.error
          } else {
            subscription = insertResult
            error = null
          }
        } catch (rpcError) {
          console.log(`⚠️ RPC approach failed, using direct insert:`, rpcError)
          // Fallback to direct insert
          const result = await supabase
            .from('subscriptions')
            .insert(subscriptionData)
            .select()
            .single()

          subscription = result.data
          error = result.error
        }
      }

      if (error) {
        console.error(`❌ Database error creating subscription:`, error)
        console.error(`❌ Error details:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return {
          success: false,
          error: `Failed to create subscription record: ${error.message} (Code: ${error.code})`,
        }
      }
      return {
        success: true,
        subscriptionId: subscription.id,
      }
    } catch (error) {
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Create a purchase record in the database
   */
  async createPurchase(data: PurchaseCreationData): Promise<PaymentResult> {
    try {
      // Use service role client for webhook operations to bypass RLS
      const supabase = createServiceRoleClient()
      const purchaseData = {
        image_id: data.imageId,
        user_id: data.userId || null,
        license_type: data.licenseType,
        amount_paid: data.amount,
        currency: data.currency,
        payment_method: data.paymentProvider,
        stripe_session_id:
          data.paymentProvider === 'stripe' ? data.externalPaymentId : null,
        paypal_payment_id:
          data.paymentProvider === 'paypal' ? data.externalPaymentId : null,
        paypal_order_id:
          data.paymentProvider === 'paypal' ? data.externalOrderId : null,
        payment_status: 'completed',
        purchased_at: new Date().toISOString(),
      }

      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single()

      if (error) {
        return { success: false, error: 'Failed to create purchase record' }
      }

      console.log(
        `✅ Purchase created: ${purchase.id} for image ${data.imageId}`
      )
      return {
        success: true,
        purchaseId: purchase.id,
      }
    } catch (error) {
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Update subscription status (for cancellations, renewals, etc.)
   */
  async updateSubscriptionStatus(
    userId: string,
    status: 'active' | 'cancelled' | 'expired',
    externalSubscriptionId?: string
  ): Promise<PaymentResult> {
    try {
      // Use service role client for webhook operations to bypass RLS
      const supabase = createServiceRoleClient()
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      // If cancelling, set the end date
      if (status === 'cancelled') {
        updateData.current_period_end = new Date().toISOString()
      }

      let query = supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId)

      // If we have external subscription ID, use it for more precise matching
      if (externalSubscriptionId) {
        query = query.eq('stripe_subscription_id', externalSubscriptionId)
      }

      const { error } = await query

      if (error) {
        return { success: false, error: 'Failed to update subscription status' }
      }

      console.log(
        `✅ Subscription status updated to ${status} for user ${userId}`
      )
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        console.error('Error fetching user subscription:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserSubscription:', error)
      return null
    }
  }

  /**
   * Check if user has purchased a specific image
   */
  async hasUserPurchasedImage(
    userId: string,
    imageId: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('image_id', imageId)
        .eq('payment_status', 'completed')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking image purchase:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in hasUserPurchasedImage:', error)
      return false
    }
  }

  /**
   * Record image download for usage tracking
   */
  async recordImageDownload(
    userId: string,
    imageId: string,
    downloadType: 'subscription' | 'purchase' | 'free' = 'subscription'
  ): Promise<void> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('image_downloads').insert({
        user_id: userId,
        image_id: imageId,
        download_type: downloadType,
        downloaded_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error recording image download:', error)
        // Don't throw here to avoid breaking the download flow
      } else {
        console.log(`✅ Download recorded: ${imageId} for user ${userId}`)
      }
    } catch (error) {
      console.error('Error in recordImageDownload:', error)
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
