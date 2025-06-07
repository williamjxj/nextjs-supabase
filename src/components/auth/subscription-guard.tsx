'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionType } from '@/lib/stripe'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredTier?: SubscriptionType
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * SubscriptionGuard component
 * Protects content that requires a subscription
 *
 * @param children - Content to render if user has required subscription
 * @param requiredTier - Subscription tier required (standard, premium, commercial)
 * @param fallback - Optional content to render if user doesn't have required subscription
 * @param redirectTo - Optional URL to redirect to if user doesn't have required subscription
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredTier,
  fallback,
  redirectTo,
}) => {
  const { user, loading, hasSubscriptionAccess } = useAuth()
  const router = useRouter()

  // While auth is loading, show nothing
  if (loading) {
    return null
  }

  // If user is not logged in, redirect to login
  if (!user) {
    if (redirectTo) {
      router.push('/login')
      return null
    }

    return (
      fallback || (
        <div className='p-6 bg-gray-100 rounded-lg'>
          <h3 className='text-lg font-medium text-gray-900'>
            Authentication Required
          </h3>
          <p className='mt-2 text-gray-600'>
            Please log in to access this content.
          </p>
          <button
            onClick={() => router.push('/login')}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Log In
          </button>
        </div>
      )
    )
  }

  // Check if user has required subscription
  const hasAccess = hasSubscriptionAccess(requiredTier)

  if (!hasAccess) {
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }

    return (
      fallback || (
        <div className='p-6 bg-gray-100 rounded-lg'>
          <h3 className='text-lg font-medium text-gray-900'>
            Subscription Required
          </h3>
          <p className='mt-2 text-gray-600'>
            {requiredTier
              ? `This content requires a ${requiredTier} subscription or higher.`
              : 'This content requires an active subscription.'}
          </p>
          <button
            onClick={() =>
              router.push(
                `/membership${requiredTier ? `?tier=${requiredTier}` : ''}`
              )
            }
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            View Membership Options
          </button>
        </div>
      )
    )
  }

  // User has the required subscription
  return <>{children}</>
}
