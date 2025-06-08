import { createServerSupabaseClient } from './server'
import { AuthUser } from '@/types/auth'
import { hasActiveSubscription, getUserSubscription } from './subscriptions'
import { SubscriptionType } from '@/lib/stripe'

// Define subscription plan hierarchy for access control
const planHierarchy: Record<SubscriptionType, number> = {
  standard: 1,
  premium: 2,
  commercial: 3,
}

// Helper function to extract subscription plan type safely (Vercel schema)
const extractPlanType = (subscription: any): SubscriptionType | null => {
  try {
    if (!subscription?.prices?.products?.name) return null
    
    // Map product names back to subscription types
    const productNameMap: Record<string, SubscriptionType> = {
      'Basic Plan': 'standard',
      'Pro Plan': 'premium',
      'Premium Plan': 'commercial'
    }
    
    return productNameMap[subscription.prices.products.name] || null
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
  requiredType: SubscriptionType
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
