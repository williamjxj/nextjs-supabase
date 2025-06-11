'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SubscriptionType } from '@/lib/stripe'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
  requireSubscription?: boolean
  requiredTier?: SubscriptionType
  subscriptionRedirectTo?: string
}

export const AuthGuard = ({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
  requireSubscription = false,
  requiredTier,
  subscriptionRedirectTo,
}: AuthGuardProps) => {
  const { user, loading, hasSubscriptionAccess } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User should be authenticated but isn't
        router.push(redirectTo || '/login')
      } else if (!requireAuth && user) {
        // User shouldn't be authenticated but is (e.g., login page when already logged in)
        router.push(redirectTo || '/gallery')
      } else if (requireSubscription && user) {
        // Check if user has required subscription
        const hasRequiredAccess = hasSubscriptionAccess(requiredTier)
        if (!hasRequiredAccess) {
          // User doesn't have required subscription
          router.push(
            subscriptionRedirectTo ||
              `/membership${requiredTier ? `?tier=${requiredTier}` : ''}`
          )
        }
      }
    }
  }, [
    user,
    loading,
    requireAuth,
    redirectTo,
    router,
    requireSubscription,
    requiredTier,
    hasSubscriptionAccess,
    subscriptionRedirectTo,
  ])

  // Show loading while checking auth state
  if (loading) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <LoadingSpinner size='lg' />
        </div>
      )
    )
  }

  // If require auth but no user, don't render children (redirect will happen)
  if (requireAuth && !user) {
    return null
  }

  // If don't require auth but user exists, don't render children (redirect will happen)
  if (!requireAuth && user) {
    return null
  }

  // If require subscription but user doesn't have it, don't render children (redirect will happen)
  if (requireSubscription && user && !hasSubscriptionAccess(requiredTier)) {
    return null
  }

  return <>{children}</>
}
