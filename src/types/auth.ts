import { User } from '@supabase/supabase-js'
import { SubscriptionType } from '@/lib/stripe'
import type { Tables } from '@/types/types_db'

export interface Subscription {
  id: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string | null
  stripe_subscription_id?: string
  prices?: {
    id: string
    unit_amount: number
    currency: string
    interval: string
    interval_count: number
    products?: {
      id: string
      name: string
      description?: string
      active: boolean
      metadata?: Record<string, any>
    }
  }
}

export interface AuthUser extends User {
  id: string
  email?: string
  subscription?: Subscription | null
  hasActiveSubscription?: boolean
  subscriptionTier?: SubscriptionType | null
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasSubscriptionAccess: (requiredTier?: SubscriptionType) => boolean
}

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}
