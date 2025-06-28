/**
 * Comprehensive logout utility that ensures complete user logout
 * across all storage mechanisms and auth states
 */

import { supabase } from '@/lib/supabase/client'

export const forceLogout = async (): Promise<void> => {
  try {
    console.log('🔍 Starting comprehensive logout...')

    // Step 1: Clear user state immediately (if in React context)
    // This will be handled by the calling component

    // Step 2: Call Supabase signOut
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('🔍 Supabase signOut error:', error)
      } else {
        console.log('🔍 Supabase signOut successful')
      }
    } catch (supabaseError) {
      console.warn('🔍 Supabase signOut exception:', supabaseError)
    }

    // Step 3: Clear all browser storage
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const localKeys = Object.keys(localStorage).filter(
        key => 
          key.startsWith('sb-') || 
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('session')
      )
      localKeys.forEach(key => {
        console.log('🔍 Clearing localStorage:', key)
        localStorage.removeItem(key)
      })

      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(
        key => 
          key.startsWith('sb-') || 
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('session')
      )
      sessionKeys.forEach(key => {
        console.log('🔍 Clearing sessionStorage:', key)
        sessionStorage.removeItem(key)
      })

      // Clear any auth-related cookies by setting them to expire
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

    // Step 4: Call server-side logout API
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        console.log('🔍 Server-side logout successful')
      } else {
        console.warn('🔍 Server-side logout failed:', response.status)
      }
    } catch (apiError) {
      console.warn('🔍 Server-side logout API error:', apiError)
    }

    console.log('🔍 Comprehensive logout completed')
  } catch (error) {
    console.error('🔍 Force logout error:', error)
    // Don't throw - we want logout to always succeed
  }
}

/**
 * Logout and redirect to home page
 */
export const logoutAndRedirect = async (): Promise<void> => {
  await forceLogout()
  
  // Force complete page reload to clear all React state
  if (typeof window !== 'undefined') {
    window.location.replace('/')
  }
}

/**
 * Check if user appears to be logged in based on storage
 */
export const hasAuthTokens = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const hasLocalStorage = Object.keys(localStorage).some(
    key => key.startsWith('sb-') || key.includes('supabase')
  )
  
  const hasSessionStorage = Object.keys(sessionStorage).some(
    key => key.startsWith('sb-') || key.includes('supabase')
  )
  
  return hasLocalStorage || hasSessionStorage
}

/**
 * Emergency logout - clears everything without API calls
 */
export const emergencyLogout = (): void => {
  console.log('🔍 Emergency logout initiated')
  
  if (typeof window !== 'undefined') {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    
    // Force reload
    window.location.replace('/')
  }
}
