import { loadStripe, Stripe } from '@stripe/stripe-js'
import StripeSDK from 'stripe'

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

// Server-side Stripe instance
export const stripe = new StripeSDK(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

// Price configuration for image purchases
export const IMAGE_PRICE_CONFIG = {
  standard: {
    amount: 500, // $5.00 in cents
    currency: 'usd',
    name: 'Standard Image License',
    description: 'High-quality image download with standard usage rights',
  },
  premium: {
    amount: 1500, // $15.00 in cents
    currency: 'usd',
    name: 'Premium Image License',
    description: 'High-quality image download with extended usage rights',
  },
  commercial: {
    amount: 3000, // $30.00 in cents
    currency: 'usd',
    name: 'Commercial Image License',
    description:
      'High-quality image download with full commercial usage rights',
  },
} as const

// Subscription configuration
export const SUBSCRIPTION_PRICE_CONFIG = {
  standard: {
    amount: 999, // $9.99 in cents
    currency: 'usd',
    name: 'Standard Plan',
    description: 'Perfect for personal projects and small business use',
    interval: 'month',
    stripe_price_id: process.env.STRIPE_STANDARD_PRICE_ID, // Set this in your .env
  },
  premium: {
    amount: 1999, // $19.99 in cents
    currency: 'usd',
    name: 'Premium Plan',
    description: 'Ideal for larger commercial projects and marketing',
    interval: 'month',
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID, // Set this in your .env
  },
  commercial: {
    amount: 3999, // $39.99 in cents
    currency: 'usd',
    name: 'Commercial Plan',
    description: 'Full commercial rights for any business use',
    interval: 'month',
    stripe_price_id: process.env.STRIPE_COMMERCIAL_PRICE_ID, // Set this in your .env
  },
} as const

export type ImageLicenseType = keyof typeof IMAGE_PRICE_CONFIG
export type SubscriptionType = keyof typeof SUBSCRIPTION_PRICE_CONFIG
