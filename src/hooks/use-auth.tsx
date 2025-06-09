'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { AuthState, AuthUser } from '@/types/auth'
import * as authService from '@/lib/supabase/auth'
import { SubscriptionType } from '@/lib/stripe'

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
  const [loading, setLoading] = useState(true)

  // Helper function to enrich user with subscription data
  const enrichUserWithSubscription = async (baseUser: User): Promise<AuthUser> => {
    try {
      // Fetch user subscription
      const { data: userSubscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          prices (
            *,
            products (*)
          )
        `)
        .eq('user_id', baseUser.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created', { ascending: false })
        .limit(1)

      const subscription = userSubscriptions?.[0] || null
      const hasActiveSubscription = subscription?.status === 'active'

      const enrichedUser = {
        ...baseUser,
        subscription,
        hasActiveSubscription,
      } as AuthUser

      return enrichedUser
    } catch (error) {
      console.error('Error enriching user with subscription:', error)
      return {
        ...baseUser,
        subscription: null,
        hasActiveSubscription: false,
      } as AuthUser
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const session = await authService.getSession()
      if (session?.user) {
        const enrichedUser = await enrichUserWithSubscription(session.user)
        setUser(enrichedUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const enrichedUser = await enrichUserWithSubscription(session.user)
          setUser(enrichedUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error)
        // Set user to null on error to maintain consistent state
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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
      }, 500)
      
    } catch (error) {
      console.error('signIn error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signUp(email, password)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } finally {
      setLoading(false)
    }
  }

  // Function to manually refresh auth state
  const refreshAuthState = async () => {
    setLoading(true)
    try {
      // First try to get the session
      const session = await authService.getSession()
      
      // Check if session is expired
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        if (expiresAt <= now) {
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
      console.error('Manual refresh error:', error)
      // On error, clear the state to ensure consistency
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has access to specific subscription tier
  const hasSubscriptionAccess = (requiredTier?: SubscriptionType): boolean => {
    if (!user || !user.hasActiveSubscription || !user.subscription) {
      return false
    }

    if (!requiredTier) {
      return true // If no specific tier is required, any active subscription is enough
    }

    // Get the user's plan type (Vercel schema)
    const userPlanType = (() => {
      if (!user.subscription?.prices?.products?.name) return null
      
      // Map product names to subscription types
      const productNameMap: Record<string, SubscriptionType> = {
        'Basic Plan': 'standard',
        'Pro Plan': 'premium',
        'Premium Plan': 'commercial'
      }
      
      return productNameMap[user.subscription.prices.products.name] || null
    })()

    // Define tier hierarchy
    const tierLevels: Record<SubscriptionType, number> = {
      standard: 1,
      premium: 2,
      commercial: 3,
    }

    // Check if user's tier is equal or higher than the required tier
    return Boolean(userPlanType && tierLevels[userPlanType] >= tierLevels[requiredTier])
  }

  const value: AuthState = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasSubscriptionAccess,
    refreshAuthState, // Auth state refresh function
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
