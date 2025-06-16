// Simplified subscription utilities
import { createClient } from '@/lib/supabase/server'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
  UserSubscription,
} from '@/lib/subscription-config'

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

// Check if a user has an active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (!userId) return false

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return false
  }

  // Check if subscription is still valid (not expired)
  const now = new Date()
  const periodEnd = new Date(data.current_period_end)
  return periodEnd > now
}

// Get user's current subscription details
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    features: Array.isArray(data.features) ? (data.features as string[]) : [],
  } as UserSubscription
}

// Get all available subscription plans
export async function getSubscriptionPlans() {
  return Object.values(SUBSCRIPTION_PLANS)
}

// Get subscription plan by type
export async function getSubscriptionPlanByType(type: SubscriptionPlanType) {
  return SUBSCRIPTION_PLANS[type] || null
}

// Create a new subscription for a user
export async function createUserSubscription(
  userId: string,
  planType: SubscriptionPlanType,
  billingInterval: 'monthly' | 'yearly',
  stripeSubscriptionId?: string
): Promise<UserSubscription | null> {
  const supabase = await createClient()
  const plan = SUBSCRIPTION_PLANS[planType]

  if (!plan) {
    throw new Error(`Invalid plan type: ${planType}`)
  }

  const currentPeriodEnd = new Date()
  if (billingInterval === 'monthly') {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
  } else {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      price_monthly: plan.priceMonthly,
      price_yearly: plan.priceYearly,
      status: 'active',
      billing_interval: billingInterval,
      stripe_subscription_id: stripeSubscriptionId,
      current_period_start: new Date().toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      features: plan.features,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    return null
  }

  return {
    ...data,
    features: Array.isArray(data.features) ? (data.features as string[]) : [],
  } as UserSubscription
}

// Update subscription status
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({ status })
    .eq('id', subscriptionId)

  if (error) {
    console.error('Error updating subscription status:', error)
    return false
  }

  return true
}

// Get template subscription plans from database (the ones with user_id = '00000000-0000-0000-0000-000000000000')
export async function getTemplatePlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching template plans:', error)
    return []
  }

  return data || []
}
