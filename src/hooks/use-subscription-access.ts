'use client'

import { useAuth } from './use-auth'
import { useSubscription } from './use-subscription'
import { SubscriptionType } from '@/lib/stripe'

interface SubscriptionAccessHook {
  loading: boolean
  hasAnySubscription: boolean
  hasAccess: (requiredTier?: SubscriptionType) => boolean
  currentTier: SubscriptionType | null
  isGracePeriod: boolean
  isExpired: boolean
  isActive: boolean
}

/**
 * Custom hook for checking subscription access
 * Combines data from auth and subscription hooks
 */
export function useSubscriptionAccess(): SubscriptionAccessHook {
  const { user, loading: authLoading, hasSubscriptionAccess } = useAuth()
  const {
    loading: subscriptionLoading,
    isActive,
    isTrialing,
    isExpired,
    subscription,
  } = useSubscription()

  const loading = authLoading || subscriptionLoading
  const hasAnySubscription =
    !!user?.hasActiveSubscription || isActive || isTrialing

  // Determine current subscription tier from Vercel schema
  const currentTier = subscription?.prices?.products?.name?.toLowerCase() as SubscriptionType || null

  // Function to check access to a specific tier
  const hasAccess = (requiredTier?: SubscriptionType): boolean => {
    // Use the auth context method if available
    if (hasSubscriptionAccess) {
      return hasSubscriptionAccess(requiredTier)
    }

    // Fallback to direct checking
    if (!hasAnySubscription) return false

    if (!requiredTier) return true // Any subscription is sufficient

    if (!currentTier) return false // No tier information available

    // Define tier hierarchy based on product names
    const tierLevels: Record<string, number> = {
      'basic': 1,
      'basic plan': 1,
      'pro': 2,
      'pro plan': 2,
      'premium': 3,
      'premium plan': 3,
    }

    const currentLevel = tierLevels[currentTier.toLowerCase()] || 0
    const requiredLevel = tierLevels[requiredTier.toLowerCase()] || 1

    // User's tier must be equal or higher than required tier
    return currentLevel >= requiredLevel
  }

  return {
    loading,
    hasAnySubscription,
    hasAccess,
    currentTier,
    isGracePeriod: isTrialing, // Map trialing to grace period
    isExpired: isExpired || false, // Convert null to false
    isActive,
  }
}
