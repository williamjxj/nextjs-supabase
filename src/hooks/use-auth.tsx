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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('=== useAuth: Getting initial session ===')
      const session = await authService.getSession()
      console.log('Initial session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email
      })
      if (session?.user) {
        const initialUser = session.user as AuthUser
        setUser(initialUser)
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
      console.log('=== useAuth: Auth state change ===')
      console.log('Event:', event)
      console.log('Session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      })
      if (session?.user) {
        const authUser = session.user as AuthUser
        setUser(authUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signIn(email, password)
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
    hasSubscriptionAccess, // Add the subscription check method to the context
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
