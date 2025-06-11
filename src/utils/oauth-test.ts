/**
 * Test Google OAuth Configuration
 * 
 * This file helps test and debug Google OAuth issues
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function testGoogleOAuth() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('Testing Google OAuth Configuration...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Expected redirect URI:', `${supabaseUrl}/auth/v1/callback`)
    
    // Test the OAuth URL generation
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      console.error('OAuth initiation error:', error)
      return { success: false, error }
    }
    
    console.log('OAuth URL generated successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Test failed:', error)
    return { success: false, error }
  }
}

export function getOAuthDebugInfo() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    expectedRedirectUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    clientId: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET,
    currentDomain: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  }
}
