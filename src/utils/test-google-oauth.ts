/**
 * Test Google OAuth Configuration
 * Run this in the browser console to debug OAuth issues
 */

export function testGoogleOAuthConfig() {
  // Note: Client-side can't access server-side env vars like SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    expectedRedirectUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    googleClientId: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID || 'Not accessible from client-side',
    hasGoogleSecret: 'Cannot check from client-side (server-side only)',
    currentClientId: '223496341184-v8nl8agrj6295kv1pp82apjdghhtkscd.apps.googleusercontent.com',
    note: 'Google OAuth secret is configured server-side and not accessible from browser'
  }
  
  console.log('🔍 Google OAuth Configuration:')
  console.log('Supabase URL:', config.supabaseUrl)
  console.log('Expected Redirect URI:', config.expectedRedirectUri)
  console.log('Google Client ID (from env):', config.googleClientId)
  console.log('Current Client ID:', config.currentClientId)
  console.log('Google Secret Status:', config.hasGoogleSecret)
  console.log('Note:', config.note)
  console.log('')
  console.log('✅ Make sure these redirect URIs are added to Google Cloud Console:')
  getRequiredRedirectURIs().forEach(uri => console.log(`   ${uri}`))
  
  return config
}

export function getRequiredRedirectURIs() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  return [
    `${baseUrl}/auth/v1/callback`,
    'http://127.0.0.1:54321/auth/v1/callback',
    'http://localhost:54321/auth/v1/callback'
  ]
}

// Run this in browser console after OAuth fails to see the exact error
export function debugOAuthError() {
  const urlParams = new URLSearchParams(window.location.search)
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  
  if (error) {
    console.error('❌ OAuth Error:', error)
    console.error('📝 Error Description:', errorDescription)
    
    if (error === 'redirect_uri_mismatch') {
      console.log('🔧 To fix this error, add these URIs to Google Cloud Console:')
      getRequiredRedirectURIs().forEach(uri => console.log(`   ${uri}`))
    }
  }
  
  return { error, errorDescription }
}
