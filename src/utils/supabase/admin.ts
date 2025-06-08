import { toDateTime } from '@/lib/utils/helpers';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database, Tables, TablesInsert } from '@/types/types_db';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;

// Change to control trial period length
const TRIAL_PERIOD_DAYS = 0;

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata
  };

  const { error: upsertError } = await supabaseAdmin
    .from('products')
    .upsert([productData]);
  if (upsertError)
    throw new Error(`Product insert/update failed: ${upsertError.message}`);
  console.log(`Product inserted/updated: ${product.id}`);
};

export interface CustomerData {
  id: string
  stripe_customer_id: string
  user_id: string
  email: string
  created_at: string
  updated_at: string
}

export interface SubscriptionData {
  id: string
  user_id: string
  plan_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string
  created_at: string
  updated_at: string
}

/**
 * Supabase admin utilities for subscription management
 */
export class SupabaseAdmin {
  
  /**
   * Create or update customer record
   */
  static async upsertCustomer(params: {
    userId: string
    stripeCustomerId: string
    email: string
  }): Promise<CustomerData> {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .upsert([
          {
            id: params.userId,
            stripe_customer_id: params.stripeCustomerId,
            user_id: params.userId,
            email: params.email,
            updated_at: new Date().toISOString(),
          },
        ], {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting customer:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to upsert customer:', error)
      throw error
    }
  }

  /**
   * Get customer by user ID
   */
  static async getCustomer(userId: string): Promise<CustomerData | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting customer:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get customer:', error)
      return null
    }
  }

  /**
   * Create or update subscription record
   */
  static async upsertSubscription(params: {
    userId: string
    stripeSubscription: Stripe.Subscription
    planType: string
  }): Promise<SubscriptionData> {
    try {
      // First get the plan ID
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('type', params.planType)
        .single()

      if (planError || !plan) {
        throw new Error(`Subscription plan not found for type: ${params.planType}`)
      }

      const subscriptionData = {
        user_id: params.userId,
        plan_id: plan.id,
        stripe_subscription_id: params.stripeSubscription.id,
        stripe_customer_id: params.stripeSubscription.customer as string,
        status: params.stripeSubscription.status,
        current_period_start: new Date(
          params.stripeSubscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          params.stripeSubscription.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: params.stripeSubscription.cancel_at_period_end,
        canceled_at: params.stripeSubscription.canceled_at
          ? new Date(params.stripeSubscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .upsert([subscriptionData], {
          onConflict: 'stripe_subscription_id',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting subscription:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to upsert subscription:', error)
      throw error
    }
  }

  /**
   * Get active subscription for user
   */
  static async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            type,
            description,
            price,
            currency,
            interval,
            features
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting user subscription:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get user subscription:', error)
      return null
    }
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(params: {
    stripeSubscriptionId: string
    status: string
    cancelAtPeriodEnd?: boolean
    canceledAt?: string
  }): Promise<void> {
    try {
      const updateData: any = {
        status: params.status,
        updated_at: new Date().toISOString(),
      }

      if (params.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = params.cancelAtPeriodEnd
      }

      if (params.canceledAt) {
        updateData.canceled_at = params.canceledAt
      }

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', params.stripeSubscriptionId)

      if (error) {
        console.error('Error updating subscription status:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error)
      throw error
    }
  }

  /**
   * Record subscription invoice
   */
  static async recordInvoice(params: {
    stripeInvoice: Stripe.Invoice
    userId: string
    subscriptionId: string
  }): Promise<void> {
    try {
      const invoiceData = {
        subscription_id: params.subscriptionId,
        user_id: params.userId,
        stripe_invoice_id: params.stripeInvoice.id,
        stripe_payment_intent_id: params.stripeInvoice.payment_intent as string,
        amount_paid: (params.stripeInvoice.amount_paid || 0) / 100, // Convert from cents
        currency: params.stripeInvoice.currency,
        invoice_period_start: params.stripeInvoice.period_start
          ? new Date(params.stripeInvoice.period_start * 1000).toISOString()
          : null,
        invoice_period_end: params.stripeInvoice.period_end
          ? new Date(params.stripeInvoice.period_end * 1000).toISOString()
          : null,
        status: params.stripeInvoice.status || 'unknown',
        payment_method: params.stripeInvoice.payment_intent?.toString() || null,
        receipt_url: params.stripeInvoice.hosted_invoice_url,
      }

      const { error } = await supabaseAdmin
        .from('subscription_invoices')
        .upsert([invoiceData], {
          onConflict: 'stripe_invoice_id',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Error recording invoice:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to record invoice:', error)
      throw error
    }
  }

  /**
   * Get subscription plans
   */
  static async getSubscriptionPlans() {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) {
        console.error('Error getting subscription plans:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get subscription plans:', error)
      throw error
    }
  }
}

export default SupabaseAdmin
