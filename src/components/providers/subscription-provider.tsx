'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { SubscriptionPlanType } from '@/lib/subscription-config'

interface SubscriptionContextType {
  loading: boolean
  isSubscribed: boolean
  subscriptionTier: SubscriptionPlanType | null
  isGracePeriod: boolean
  isExpired: boolean
  daysRemaining: number | null
  hasAccess: (requiredTier?: SubscriptionPlanType) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error(
      'useSubscriptionContext must be used within SubscriptionProvider'
    )
  }
  return context
}

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { user } = useAuth()
  const { loading, subscription, isActive, isPastDue, isExpired } = useSubscription()

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  // Calculate days remaining in subscription
  useEffect(() => {
    if (subscription && subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end)
      const now = new Date()
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays > 0 ? diffDays : 0)
    } else {
      setDaysRemaining(null)
    }
  }, [subscription])

  // Determine current subscription tier (Vercel schema)
  const subscriptionTier = React.useMemo(() => {
    if (!subscription?.prices?.products?.name) return null
    
    // Map product names to subscription types
    const productNameMap: Record<string, SubscriptionPlanType> = {
      'Basic Plan': 'standard',
      'Pro Plan': 'premium',
      'Premium Plan': 'commercial'
    }
    
    return productNameMap[subscription.prices.products.name] || null
  }, [subscription])

  // Grace period logic (past due but not expired)
  const isGracePeriod = isPastDue && !(isExpired ?? true)
  const expired = isExpired ?? true

  // Function to check access to a specific tier
  const hasAccess = (requiredTier?: SubscriptionPlanType): boolean => {
    if (!isActive && !isGracePeriod) return false

    if (!requiredTier) return true // Any subscription is sufficient

    if (!subscriptionTier) return false // No tier information available

    // Define tier hierarchy
    const tierLevels: Record<SubscriptionPlanType, number> = {
      standard: 1,
      premium: 2,
      commercial: 3,
    }

    // User's tier must be equal or higher than required tier
    return tierLevels[subscriptionTier] >= tierLevels[requiredTier]
  }

  const value: SubscriptionContextType = {
    loading,
    isSubscribed: isActive || isGracePeriod,
    subscriptionTier,
    isGracePeriod,
    isExpired: expired,
    daysRemaining,
    hasAccess,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
