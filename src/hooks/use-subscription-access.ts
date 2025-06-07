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
    isGracePeriod,
    isExpired,
    subscription,
  } = useSubscription()

  const loading = authLoading || subscriptionLoading
  const hasAnySubscription =
    !!user?.hasActiveSubscription || isActive || isGracePeriod

  // Determine current subscription tier
  const currentTier =
    (subscription?.subscription_plans?.type as SubscriptionType) || null

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

    // Define tier hierarchy
    const tierLevels: Record<SubscriptionType, number> = {
      standard: 1,
      premium: 2,
      commercial: 3,
    }

    // User's tier must be equal or higher than required tier
    return tierLevels[currentTier] >= tierLevels[requiredTier]
  }

  return {
    loading,
    hasAnySubscription,
    hasAccess,
    currentTier,
    isGracePeriod,
    isExpired,
    isActive,
  }
}
