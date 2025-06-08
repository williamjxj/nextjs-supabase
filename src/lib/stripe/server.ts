import Stripe from 'stripe'

// Server-side Stripe configuration following Vercel template patterns
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Enhanced price configuration with Stripe Price IDs
export const SUBSCRIPTION_PRICES = {
  starter: {
    monthly: {
      amount: 999, // $9.99
      currency: 'usd',
      interval: 'month',
      stripe_price_id: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    },
    annual: {
      amount: 9999, // $99.99 (2 months free)
      currency: 'usd', 
      interval: 'year',
      stripe_price_id: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    },
  },
  pro: {
    monthly: {
      amount: 1999, // $19.99
      currency: 'usd',
      interval: 'month',
      stripe_price_id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    },
    annual: {
      amount: 19999, // $199.99 (2 months free)
      currency: 'usd',
      interval: 'year', 
      stripe_price_id: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    },
  },
  enterprise: {
    monthly: {
      amount: 4999, // $49.99
      currency: 'usd',
      interval: 'month',
      stripe_price_id: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    },
    annual: {
      amount: 49999, // $499.99 (2 months free)
      currency: 'usd',
      interval: 'year',
      stripe_price_id: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID!,
    },
  },
} as const

export const SUBSCRIPTION_FEATURES = {
  starter: {
    name: 'Starter',
    description: 'Perfect for personal projects',
    maxUploads: 100,
    storageLimit: '1GB',
    features: ['Basic editing', 'Standard support'],
    commercialUse: false,
    prioritySupport: false,
  },
  pro: {
    name: 'Pro',
    description: 'Ideal for professionals and small teams',
    maxUploads: 1000,
    storageLimit: '10GB',
    features: ['Advanced editing', 'Bulk operations', 'Commercial license'],
    commercialUse: true,
    prioritySupport: false,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Complete solution for organizations',
    maxUploads: 'unlimited' as const,
    storageLimit: '100GB',
    features: [
      'All features',
      'API access',
      'Custom branding',
      'Priority support',
      'Custom integrations'
    ],
    commercialUse: true,
    prioritySupport: true,
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PRICES
export type BillingInterval = 'monthly' | 'annual'

// Helper function to get all available prices
export function getAllPrices() {
  const prices: Array<{
    tier: SubscriptionTier
    interval: BillingInterval
    priceId: string
    amount: number
    currency: string
  }> = []

  Object.entries(SUBSCRIPTION_PRICES).forEach(([tier, intervals]) => {
    Object.entries(intervals).forEach(([interval, priceData]) => {
      prices.push({
        tier: tier as SubscriptionTier,
        interval: interval as BillingInterval,
        priceId: priceData.stripe_price_id,
        amount: priceData.amount,
        currency: priceData.currency,
      })
    })
  })

  return prices
}

// Helper function to get price by tier and interval
export function getPrice(tier: SubscriptionTier, interval: BillingInterval) {
  return SUBSCRIPTION_PRICES[tier][interval]
}

// Helper function to get features by tier
export function getFeatures(tier: SubscriptionTier) {
  return SUBSCRIPTION_FEATURES[tier]
}

// Webhook event types we handle
export const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.upcoming',
  'checkout.session.completed',
] as const

export type WebhookEventType = typeof WEBHOOK_EVENTS[number]
