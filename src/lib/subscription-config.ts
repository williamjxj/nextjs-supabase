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

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlanType,
  SubscriptionPlan
> = {
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
      'Email support',
    ],
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
      'Advanced filters and search',
    ],
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
      'Custom licensing options',
    ],
  },
}

// Stripe price IDs - these can be environment variables or hardcoded
// For development, you can create these in your Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  standard: {
    monthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID,
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  },
  commercial: {
    monthly: process.env.STRIPE_COMMERCIAL_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_COMMERCIAL_YEARLY_PRICE_ID,
  },
}

// Helper function to get plan details by Stripe price ID
export function getPlanByPriceId(priceId: string | undefined): {
  planType: SubscriptionPlanType
  billingInterval: BillingInterval
} | null {
  if (!priceId) return null

  // Create reverse mapping from price IDs
  for (const [planType, priceIds] of Object.entries(STRIPE_PRICE_IDS)) {
    if (priceIds.monthly === priceId) {
      return {
        planType: planType as SubscriptionPlanType,
        billingInterval: 'monthly',
      }
    }
    if (priceIds.yearly === priceId) {
      return {
        planType: planType as SubscriptionPlanType,
        billingInterval: 'yearly',
      }
    }
  }

  return null
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
