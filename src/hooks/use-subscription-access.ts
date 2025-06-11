'use client'

import { useAuth } from './use-auth'
import { SubscriptionPlanType } from '@/lib/subscription-config'

interface SubscriptionAccessHook {
  loading: boolean
  hasAnySubscription: boolean
  hasAccess: (requiredTier?: SubscriptionPlanType) => boolean
  currentTier: SubscriptionPlanType | null
  isGracePeriod: boolean
  isExpired: boolean
  isActive: boolean
}

/**
 * Custom hook for checking subscription access
 * Uses simplified subscription system
 */
export function useSubscriptionAccess(): SubscriptionAccessHook {
  const { user, loading: authLoading, hasSubscriptionAccess } = useAuth()

  const subscription = user?.subscription
  const isActive = subscription?.status === 'active'
  const isExpired = subscription?.status === 'expired'
  const isGracePeriod = false // Simplified - we don't track grace periods
  const hasAnySubscription = Boolean(subscription && subscription.status === 'active')
  const currentTier = subscription?.plan_type || null

  // Function to check access to a specific tier
  const hasAccess = (requiredTier?: SubscriptionPlanType): boolean => {
    // Use the auth context method if available
    if (hasSubscriptionAccess) {
      return hasSubscriptionAccess(requiredTier)
    }

    // Fallback to direct checking
    if (!hasAnySubscription) return false

    if (!requiredTier) return true // Any subscription is sufficient

    if (!currentTier) return false // No tier information available

    // Define tier hierarchy
    const tierLevels: Record<SubscriptionPlanType, number> = {
      standard: 1,
      premium: 2,
      commercial: 3,
    }

    const currentLevel = tierLevels[currentTier] || 0
    const requiredLevel = tierLevels[requiredTier] || 1

    // User's tier must be equal or higher than required tier
    return currentLevel >= requiredLevel
  }

  return {
    loading: authLoading,
    hasAnySubscription,
    hasAccess,
    currentTier,
    isGracePeriod,
    isExpired: isExpired || false,
    isActive: isActive || false,
  }
}
