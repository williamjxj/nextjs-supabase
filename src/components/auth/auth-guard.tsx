'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export const AuthGuard = ({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
}: AuthGuardProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User should be authenticated but isn't
        router.push(redirectTo || '/login')
      } else if (!requireAuth && user) {
        // User shouldn't be authenticated but is (e.g., login page when already logged in)
        router.push(redirectTo || '/gallery')
      }
    }
  }, [user, loading, requireAuth, redirectTo, router])

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

  return <>{children}</>
}
