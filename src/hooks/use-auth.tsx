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
  const [loading, setLoading] = useState(false) // Start with false to show login buttons immediately
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to enrich user with subscription data
  const enrichUserWithSubscription = async (
    baseUser: User
  ): Promise<AuthUser> => {
    try {
      // Only try to fetch subscription data for authenticated users
      if (!baseUser?.id) {
        return {
          ...baseUser,
          subscription: null,
          hasActiveSubscription: false,
          subscriptionTier: null,
        } as AuthUser
      }

      // Fetch user subscription with enhanced query
      const { data: userSubscriptions, error } = await supabase
        .from('subscriptions')
        .select(
          `
          *,
          features,
          created_at,
          updated_at,
          current_period_end
        `
        )
        .eq('user_id', baseUser.id)
        .in('status', ['active'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        // Log subscription fetch errors, but don't throw - continue with null subscription
        console.warn(
          'Error fetching user subscription (continuing with null):',
          error
        )
      }

      const subscription = userSubscriptions?.[0] || null
      const hasActiveSubscription =
        subscription && ['active'].includes(subscription.status)

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

      return enrichedUser
    } catch (error) {
      // Don't log as error since this is expected for unauthenticated users
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
    // Get initial session only after component is mounted
    const getInitialSession = async () => {
      if (!mounted) return

      setLoading(true) // Only set loading when we're actually checking
      try {
        const session = await authService.getSession()
        if (session?.user) {
          const enrichedUser = await enrichUserWithSubscription(session.user)
          setUser(enrichedUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        // Only log authentication errors, not subscription errors
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.warn('Error getting initial session:', errorMessage)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      getInitialSession()
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      try {
        if (session?.user) {
          const enrichedUser = await enrichUserWithSubscription(session.user)
          setUser(enrichedUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.warn('Error in auth state change handler:', errorMessage)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [mounted])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // First, ensure we have a clean state by clearing any stale cookies
      await supabase.auth.signOut()

      // Wait briefly for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await authService.signIn(email, password)

      // Ensure the session is properly synchronized
      if (result.user) {
        const enrichedUser = await enrichUserWithSubscription(result.user)
        setUser(enrichedUser)
      }

      // Also do a delayed refresh to ensure consistency
      setTimeout(async () => {
        await refreshAuthState()
      }, 100)
    } catch (error) {
      // Keep login errors as errors since they're important for users
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
      await authService.signOut()

      // Fallback to ensure user state is cleared
      setTimeout(() => {
        if (user) {
          setUser(null)
          setLoading(false)
        }
      }, 100)
    } catch (error) {
      throw error
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

      // Wait a moment for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100))

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
      // Only log authentication errors, not subscription errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.warn('Manual refresh error:', errorMessage)
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

  const value: AuthState = {
    user,
    loading,
    mounted,
    signIn,
    signUp,
    signOut,
    signInWithSocial, // Added for social sign-in
    hasSubscriptionAccess,
    refreshAuthState, // Auth state refresh function
    syncAuthSession, // Added for session synchronization
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
