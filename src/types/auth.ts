import { User } from '@supabase/supabase-js'
import { UserSubscription, SubscriptionPlanType } from '@/lib/subscription-config'
import type { Tables } from '@/types/types_db'

export interface Subscription {
  id: string
  plan_type: SubscriptionPlanType
  status: 'active' | 'cancelled' | 'expired'
  current_period_start?: string
  current_period_end: string
  stripe_subscription_id?: string
  features: string[]
  price_monthly: number
  price_yearly: number
  billing_interval: 'monthly' | 'yearly'
}

export interface AuthUser extends User {
  id: string
  email?: string
  subscription?: Subscription | null
  hasActiveSubscription?: boolean
  subscriptionTier?: SubscriptionPlanType | null
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  mounted: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithSocial: (provider: import('@supabase/supabase-js').Provider) => Promise<void> // Added for social sign-in
  hasSubscriptionAccess: (requiredTier?: SubscriptionPlanType) => boolean
  refreshAuthState: () => Promise<void>
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
