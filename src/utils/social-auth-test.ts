// Test file to verify social authentication implementation
// This file demonstrates how the social auth system works

import { supabase } from '@/lib/supabase/client'

// Test social authentication functions
export const testSocialAuth = {
  // Test Google authentication
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Google auth error:', error)
        return { success: false, error }
      }
      
      console.log('Google auth initiated:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Google auth exception:', error)
      return { success: false, error }
    }
  },

  // Test Facebook authentication
  async signInWithFacebook() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Facebook auth error:', error)
        return { success: false, error }
      }
      
      console.log('Facebook auth initiated:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Facebook auth exception:', error)
      return { success: false, error }
    }
  },

  // Test profile creation
  async createTestProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'test@example.com',
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          provider: 'google'
        })
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        return { success: false, error }
      }

      console.log('Profile created:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Profile creation exception:', error)
      return { success: false, error }
    }
  },

  // Test profile retrieval
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile retrieval error:', error)
        return { success: false, error }
      }

      console.log('Profile retrieved:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Profile retrieval exception:', error)
      return { success: false, error }
    }
  },

  // Test current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session retrieval error:', error)
        return { success: false, error }
      }

      console.log('Current session:', session)
      return { success: true, data: session }
    } catch (error) {
      console.error('Session retrieval exception:', error)
      return { success: false, error }
    }
  }
}

// Usage examples (for development/testing)
if (typeof window !== 'undefined') {
  // Make test functions available in browser console for debugging
  (window as any).testSocialAuth = testSocialAuth
  
  console.log('🧪 Social Auth Test Functions Available:')
  console.log('- testSocialAuth.signInWithGoogle()')
  console.log('- testSocialAuth.signInWithFacebook()')
  console.log('- testSocialAuth.getCurrentSession()')
  console.log('- testSocialAuth.getProfile(userId)')
}
