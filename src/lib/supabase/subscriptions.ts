// Utility functions for subscription operations
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SubscriptionType, SUBSCRIPTION_PRICE_CONFIG } from '@/lib/stripe'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing'

// Check if a user has an active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (!userId) return false

  const supabase = await createServerSupabaseClient()
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
export async function getUserSubscription(userId: string) {
  if (!userId) return null

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      id, 
      status, 
      current_period_start, 
      current_period_end, 
      cancel_at_period_end,
      stripe_subscription_id,
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
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// Get all available subscription plans
export async function getSubscriptionPlans() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching subscription plans:', error)
    return []
  }

  return data || []
}

// Get subscription plan by type
export async function getSubscriptionPlanByType(type: SubscriptionType) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('type', type)
    .single()

  if (error) {
    console.error(`Error fetching subscription plan for type ${type}:`, error)
    return null
  }

  return data
}

// Create or update a subscription plan in the database
export async function upsertSubscriptionPlan(planData: {
  type: SubscriptionType
  name: string
  description: string
  price: number
  currency?: string
  interval?: string
  stripe_price_id?: string
  features?: any[]
  is_active?: boolean
}) {
  const supabase = await createServerSupabaseClient()

  // Default values
  const data = {
    ...planData,
    currency: planData.currency || 'usd',
    interval: planData.interval || 'month',
    is_active: planData.is_active !== undefined ? planData.is_active : true,
    features: planData.features || [],
  }

  const { data: result, error } = await supabase
    .from('subscription_plans')
    .upsert([data], {
      onConflict: 'type',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting subscription plan:', error)
    return null
  }

  return result
}

// Get subscription invoices for a user
export async function getUserSubscriptionInvoices(userId: string) {
  if (!userId) return []

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user subscription invoices:', error)
    return []
  }

  return data || []
}

// Initialize default subscription plans in the database
export async function initializeSubscriptionPlans() {
  const planPromises = Object.entries(SUBSCRIPTION_PRICE_CONFIG).map(
    ([type, config]) => {
      return upsertSubscriptionPlan({
        type: type as SubscriptionType,
        name: config.name,
        description: config.description,
        price: config.amount / 100, // Convert cents to dollars for storage
        currency: config.currency,
        interval: config.interval,
        stripe_price_id: config.stripe_price_id || undefined,
        is_active: true,
      })
    }
  )

  await Promise.all(planPromises)
  console.log('Subscription plans initialized')
}
