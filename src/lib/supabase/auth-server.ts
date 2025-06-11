import { createServerSupabaseClient } from './server'
import { AuthUser } from '@/types/auth'
import { hasActiveSubscription, getUserSubscription } from './subscriptions-simplified'
import { SubscriptionPlanType } from '@/lib/subscription-config'

// Define subscription plan hierarchy for access control
const planHierarchy: Record<SubscriptionPlanType, number> = {
  standard: 1,
  premium: 2,
  commercial: 3,
}

// Helper function to extract subscription plan type safely (simplified schema)
const extractPlanType = (subscription: any): SubscriptionPlanType | null => {
  try {
    return subscription?.plan_type || null
  } catch (error) {
    console.error('Error accessing subscription plan type:', error)
    return null
  }
}

// Check if user has a subscription
export const userHasSubscription = async (userId: string): Promise<boolean> => {
  if (!userId) return false
  return hasActiveSubscription(userId)
}

// Check if user has a specific subscription type
export const userHasSubscriptionType = async (
  userId: string,
  requiredType: SubscriptionPlanType
): Promise<boolean> => {
  if (!userId) return false

  const subscription = await getUserSubscription(userId)
  if (!subscription || subscription.status !== 'active') {
    return false
  }

  const userPlanType = extractPlanType(subscription)
  if (!userPlanType || !(userPlanType in planHierarchy)) {
    return false
  }

  // User has access if their plan tier is equal or higher than the required tier
  return planHierarchy[userPlanType] >= planHierarchy[requiredType]
}

// Get user with subscription data
export const getUserWithSubscription = async (userId: string) => {
  if (!userId) return null

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const subscription = await getUserSubscription(userId)

  return {
    ...user,
    subscription,
    hasActiveSubscription: !!subscription && subscription.status === 'active',
  }
}

// Determine user's highest subscription tier
export const getUserSubscriptionTier = async (
  userId: string
): Promise<SubscriptionType | null> => {
  if (!userId) return null

  const subscription = await getUserSubscription(userId)
  if (!subscription || subscription.status !== 'active') {
    return null
  }

  return extractPlanType(subscription)
}
