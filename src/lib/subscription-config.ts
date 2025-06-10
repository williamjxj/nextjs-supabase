// Simplified subscription configuration
export type SubscriptionPlanType = 'standard' | 'premium' | 'commercial'

export interface SubscriptionPlan {
  type: SubscriptionPlanType
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  standard: {
    type: 'standard',
    name: 'Standard Plan',
    description: 'Perfect for personal use and small projects',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: [
      'Access to standard quality images',
      'Basic usage rights',
      'Download up to 50 images/month',
      'Email support'
    ]
  },
  premium: {
    type: 'premium',
    name: 'Premium Plan',
    description: 'Great for professionals and growing businesses',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    features: [
      'Access to premium quality images',
      'Extended usage rights',
      'Download up to 200 images/month',
      'Priority email support',
      'Advanced filters and search'
    ]
  },
  commercial: {
    type: 'commercial',
    name: 'Commercial Plan',
    description: 'Everything you need for large-scale commercial use',
    priceMonthly: 39.99,
    priceYearly: 399.99,
    features: [
      'Access to all images',
      'Full commercial usage rights',
      'Unlimited downloads',
      'Priority phone support',
      'Early access to new features',
      'Custom licensing options'
    ]
  }
}

// Stripe price IDs (you'll need to create these in Stripe dashboard)
export const STRIPE_PRICE_IDS = {
  standard: {
    monthly: 'price_standard_monthly', // Replace with actual Stripe price ID
    yearly: 'price_standard_yearly'
  },
  premium: {
    monthly: 'price_premium_monthly',
    yearly: 'price_premium_yearly'
  },
  commercial: {
    monthly: 'price_commercial_monthly',
    yearly: 'price_commercial_yearly'
  }
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'
export type BillingInterval = 'monthly' | 'yearly'

export interface UserSubscription {
  id: string
  user_id: string
  plan_type: SubscriptionPlanType
  price_monthly: number
  price_yearly: number
  status: SubscriptionStatus
  billing_interval: BillingInterval
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end: string
  features: string[]
  created_at?: string
  updated_at?: string
}
