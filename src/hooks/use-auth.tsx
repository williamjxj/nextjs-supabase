'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { User, Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { AuthState, AuthUser } from '@/types/auth'
import * as authService from '@/lib/supabase/auth'
import { SubscriptionPlanType } from '@/lib/subscription-config'

const AuthContext = createContext<AuthState | null>(null)

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true) // Start with true during initial auth check
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to enrich user with subscription data (optimized for speed)
  const enrichUserWithSubscription = async (
    baseUser: User
  ): Promise<AuthUser> => {
    try {
      console.log('🔍 Starting subscription enrichment...')
      const enrichStartTime = performance.now()

      // Only try to fetch subscription data for authenticated users
      if (!baseUser?.id) {
        return {
          ...baseUser,
          subscription: null,
          hasActiveSubscription: false,
          subscriptionTier: null,
        } as AuthUser
      }

      // Skip profile creation during login for speed - it's handled in background
      // Profile creation is non-critical for login flow

      // Optimized subscription query - only fetch essential fields
      const { data: userSubscriptions, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_type, status, current_period_end, features')
        .eq('user_id', baseUser.id)
        .eq('status', 'active') // Use eq instead of in for better performance
        .order('created_at', { ascending: false })
        .limit(1)
        .single() // Use single() since we only expect one active subscription

      console.log(
        `🔍 Subscription query took: ${performance.now() - enrichStartTime}ms`
      )

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        console.warn('Error fetching user subscription:', error)
      }

      const subscription = error?.code === 'PGRST116' ? null : userSubscriptions
      const hasActiveSubscription =
        subscription && subscription.status === 'active'

      // Enhanced subscription data
      const enrichedUser = {
        ...baseUser,
        subscription,
        hasActiveSubscription,
        subscriptionTier: subscription?.plan_type || null,
        subscriptionFeatures: subscription?.features || [],
        subscriptionUsage: {}, // Usage tracking to be implemented
        subscriptionExpiresAt: subscription?.current_period_end || null,
        isTrialing: false, // Based on current status model
      } as AuthUser

      console.log(
        `🔍 Total subscription enrichment took: ${performance.now() - enrichStartTime}ms`
      )
      return enrichedUser
    } catch (error) {
      console.warn(
        'Could not enrich user with subscription data:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return {
        ...baseUser,
        subscription: null,
        hasActiveSubscription: false,
        subscriptionTier: null,
        subscriptionFeatures: [],
        subscriptionUsage: {},
        subscriptionExpiresAt: null,
        isTrialing: false,
      } as AuthUser
    }
  }

  useEffect(() => {
    // Only run after mount to avoid hydration issues
    if (!mounted) return

    console.log('🔍 Starting auth initialization...')

    // Get initial session - trust Supabase's session management
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('🔍 Initial session:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
        })

        if (session?.user) {
          try {
            const enrichedUser = await enrichUserWithSubscription(session.user)
            setUser(enrichedUser)
          } catch (enrichError) {
            // If enrichment fails, still set basic user data
            setUser({
              ...session.user,
              subscription: null,
              hasActiveSubscription: false,
              subscriptionTier: null,
            } as AuthUser)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('🔍 Auth initialization error:', error)
        setUser(null)
      } finally {
        // Always set loading to false after initialization
        setLoading(false)
      }
    }

    initializeAuth()

    // Enhanced auth state listener with better cross-tab support
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state change:', {
        event,
        hasSession: !!session,
        tabId: window.name || 'unknown',
      })

      // Handle sign out
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Handle sign in and token refresh
      if (
        session?.user &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        try {
          const enrichedUser = await enrichUserWithSubscription(session.user)
          setUser(enrichedUser)
        } catch (enrichError) {
          // Fallback to basic user data
          setUser({
            ...session.user,
            subscription: null,
            hasActiveSubscription: false,
            subscriptionTier: null,
          } as AuthUser)
        }
        setLoading(false)
      }
    })

    // Add additional cross-tab synchronization using storage events
    const handleStorageChange = async (e: StorageEvent) => {
      // Check if the auth state changed in another tab
      if (
        e.key === 'supabase.auth.token' ||
        e.key?.startsWith('supabase.auth')
      ) {
        // Small delay to ensure the storage is fully updated
        setTimeout(async () => {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession()

            // Get current user state to avoid infinite loops
            setUser(currentUser => {
              const hasSession = !!session?.user
              const hasCurrentUser = !!currentUser

              if (hasSession && !hasCurrentUser) {
                // User logged in from another tab
                enrichUserWithSubscription(session.user).then(enrichedUser => {
                  setUser(enrichedUser)
                  setLoading(false)
                })
                return currentUser // Return current state while enrichment is happening
              } else if (!hasSession && hasCurrentUser) {
                // User logged out from another tab
                setLoading(false)
                return null
              }

              return currentUser // No change needed
            })
          } catch (error) {
            console.error('🔍 Error syncing auth from storage:', error)
          }
        }, 100)
      }
    }

    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', handleStorageChange)

    // Add focus event listener to refresh auth state when tab becomes active
    const handleFocus = async () => {
      console.log('🔍 Tab focused, checking auth state...')
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Use functional update to get current user state
        setUser(currentUser => {
          const hasSession = !!session?.user
          const hasCurrentUser = !!currentUser

          if (hasSession !== hasCurrentUser) {
            console.log('🔍 Auth state out of sync, updating...', {
              hasSession,
              hasCurrentUser,
            })

            if (hasSession && session?.user) {
              enrichUserWithSubscription(session.user).then(enrichedUser => {
                setUser(enrichedUser)
                setLoading(false)
              })
              return currentUser // Return current state while enrichment is happening
            } else {
              setLoading(false)
              return null
            }
          }

          return currentUser // No change needed
        })
      } catch (error) {
        console.error('🔍 Error checking auth on focus:', error)
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [mounted]) // Removed user dependency to prevent infinite loop

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔍 Starting fast login process...')
      const startTime = performance.now()

      const result = await authService.signIn(email, password)
      console.log(
        `🔍 Auth service signIn took: ${performance.now() - startTime}ms`
      )

      if (result.user) {
        // Set user immediately for fast UI update
        setUser(result.user)
        console.log('🔍 User set immediately for fast UI')

        // Enrich user with subscription data in background (non-blocking)
        setTimeout(async () => {
          try {
            const enrichedUser = await enrichUserWithSubscription(result.user)
            setUser(enrichedUser)
            console.log('🔍 User enriched with subscription data in background')
          } catch (error) {
            console.warn('🔍 Background subscription enrichment failed:', error)
            // Don't throw - user is already logged in
          }
        }, 0)
      }

      console.log(
        `🔍 Total login process took: ${performance.now() - startTime}ms`
      )
    } catch (error) {
      console.error('signIn error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    try {
      await authService.signUp(email, password, fullName)
    } catch (error) {
      throw error // Re-throw error so signup form can handle it
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔍 Starting signOut process...')

      // Clear user state immediately
      setUser(null)
      setLoading(false)

      // Call Supabase signOut
      await authService.signOut()

      // Force clear all Supabase-related localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        )
        keys.forEach(key => {
          console.log('🔍 Clearing localStorage key:', key)
          localStorage.removeItem(key)
        })

        // Also clear sessionStorage
        const sessionKeys = Object.keys(sessionStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        )
        sessionKeys.forEach(key => {
          console.log('🔍 Clearing sessionStorage key:', key)
          sessionStorage.removeItem(key)
        })
      }

      console.log('🔍 SignOut completed successfully')
    } catch (error) {
      console.error('🔍 SignOut error:', error)
      // Even if signOut fails, clear the user state and storage
      setUser(null)
      setLoading(false)

      // Force clear storage even on error
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        )
        keys.forEach(key => localStorage.removeItem(key))

        const sessionKeys = Object.keys(sessionStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        )
        sessionKeys.forEach(key => sessionStorage.removeItem(key))
      }

      // Don't throw error - allow signout to complete
    }
  }

  const signInWithSocial = async (provider: Provider) => {
    setLoading(true)
    try {
      await authService.signInWithProvider(provider)
      // Supabase handles redirection and session management
      // Auth state will be updated by onAuthStateChange listener
    } catch (error) {
      // Keep social auth errors as errors since they're important for users
      console.error('signInWithSocial error:', error)
      // Optionally, show a toast notification to the user
      // setLoading(false) // Important: Keep loading true or manage carefully due to redirect
      throw error
    }
    // setLoading(false) // Loading state should be managed by the page after redirection or by onAuthStateChange
  }

  // Function to manually refresh auth state
  const refreshAuthState = async () => {
    setLoading(true)
    try {
      // Force session refresh to sync client and server
      await supabase.auth.refreshSession()

      // Remove unnecessary delay

      // First try to get the session
      const session = await authService.getSession()

      // Check if session is expired
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        if (expiresAt <= now) {
          console.warn('Session expired during refresh, signing out')
          await supabase.auth.signOut()
          setUser(null)
          return
        }
      }

      if (session?.user) {
        const enrichedUser = await enrichUserWithSubscription(session.user)
        setUser(enrichedUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      // On error, clear the state to ensure consistency
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has access to specific subscription tier
  const hasSubscriptionAccess = (
    requiredTier?: SubscriptionPlanType
  ): boolean => {
    if (!user || !user.hasActiveSubscription || !user.subscription) {
      return false
    }

    if (!requiredTier) {
      return true // If no specific tier is required, any active subscription is enough
    }

    // Get the user's plan type (simplified schema)
    const userPlanType = user.subscription?.plan_type || null

    if (!userPlanType) {
      return false
    }

    // Define tier hierarchy
    const tierLevels: Record<SubscriptionPlanType, number> = {
      standard: 1,
      premium: 2,
      commercial: 3,
    }

    // Check if user's tier is equal or higher than the required tier
    return Boolean(
      userPlanType && tierLevels[userPlanType] >= tierLevels[requiredTier]
    )
  }

  // Function to force session synchronization between client and server
  const syncAuthSession = async (): Promise<boolean> => {
    try {
      // Force refresh the session to ensure client and server are in sync
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.warn('Session sync failed:', error.message)
        return false
      }

      if (data?.session?.user) {
        const enrichedUser = await enrichUserWithSubscription(data.session.user)
        setUser(enrichedUser)
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.warn('Session sync error:', error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mounted,
        signIn,
        signUp,
        signOut,
        signInWithSocial, // Added for social sign-in
        hasSubscriptionAccess,
        refreshAuthState,
        syncAuthSession, // Added for session synchronization
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
