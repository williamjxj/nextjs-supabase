// Utility functions for subscription operations
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SubscriptionType, SUBSCRIPTION_PRICE_CONFIG } from '@/lib/stripe'
import type { Tables } from '@/types/types_db'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing'

// Vercel-compatible types
type Subscription = Tables<'subscriptions'> & {
  prices?: Tables<'prices'> & {
    products?: Tables<'products'>
  }
}

type Product = Tables<'products'> & {
  prices?: Tables<'prices'>[]
}

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
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (!userId) return null

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      *,
      prices (
        *,
        products (*)
      )
    `
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0] as Subscription
}

// Get all available subscription plans
export async function getSubscriptionPlans(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data || []) as Product[]
}

// Get subscription plan by type (map to product name)
export async function getSubscriptionPlanByType(type: SubscriptionType): Promise<Product | null> {
  const supabase = await createServerSupabaseClient()
  
  // Map subscription types to product names
  const productNameMap: Record<SubscriptionType, string> = {
    'standard': 'Basic Plan',
    'premium': 'Pro Plan', 
    'commercial': 'Premium Plan'
  }
  
  const productName = productNameMap[type]
  if (!productName) {
    console.error(`Unknown subscription type: ${type}`)
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('name', productName)
    .eq('active', true)
    .single()

  if (error) {
    console.error(`Error fetching product for type ${type}:`, error)
    return null
  }

  return data as Product
}

// Create or update a product in the database (Vercel pattern)
export async function upsertProduct(productData: {
  id?: string
  name: string
  description?: string
  active?: boolean
  metadata?: Record<string, any>
}) {
  const supabase = await createServerSupabaseClient()

  const data = {
    ...productData,
    active: productData.active !== undefined ? productData.active : true,
    metadata: productData.metadata || {},
  }

  const { data: result, error } = await supabase
    .from('products')
    .upsert([data], {
      onConflict: 'name',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting product:', error)
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

// Initialize default products and prices in the database (Vercel pattern)
export async function initializeSubscriptionPlans() {
  const supabase = await createServerSupabaseClient()
  
  // Create products first
  const productPromises = Object.entries(SUBSCRIPTION_PRICE_CONFIG).map(
    async ([type, config]) => {
      const { data: product, error } = await supabase
        .from('products')
        .upsert([{
          id: `prod_${type}`,
          name: config.name,
          description: config.description,
          active: true,
          metadata: { index: type === 'standard' ? 0 : type === 'premium' ? 1 : 2 }
        }], {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) {
        console.error(`Error creating product ${type}:`, error)
        return null
      }

      // Create price for the product
      const { data: price, error: priceError } = await supabase
        .from('prices')
        .upsert([{
          id: `price_${type}_monthly`,
          product_id: product.id,
          active: true,
          currency: config.currency,
          unit_amount: config.amount,
          interval: config.interval,
          interval_count: 1,
          type: 'recurring'
        }], {
          onConflict: 'id',
          ignoreDuplicates: false,
        })

      if (priceError) {
        console.error(`Error creating price for ${type}:`, priceError)
      }

      return product
    }
  )

  await Promise.all(productPromises)
  console.log('Products and prices initialized')
}
