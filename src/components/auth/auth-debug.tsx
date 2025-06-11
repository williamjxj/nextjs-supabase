'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const AuthDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkAuthConfig = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown'
    
    // This is what Supabase will use as redirect URI
    const redirectUri = `${supabaseUrl}/auth/v1/callback`
    
    const info = {
      supabaseUrl,
      currentOrigin,
      redirectUri,
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not set',
      timestamp: new Date().toISOString()
    }
    
    setDebugInfo(info)
    console.log('🔍 Auth Debug Info:', info)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔍 OAuth Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkAuthConfig} className="w-full">
          Check Auth Configuration
        </Button>
        
        {debugInfo && (
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
            <h3 className="font-semibold mb-2">Configuration Details:</h3>
            <div className="space-y-1">
              <div><strong>Supabase URL:</strong> {debugInfo.supabaseUrl}</div>
              <div><strong>Current Origin:</strong> {debugInfo.currentOrigin}</div>
              <div className="text-red-600">
                <strong>Redirect URI (add this to Google):</strong> {debugInfo.redirectUri}
              </div>
              <div><strong>Google Client ID:</strong> {debugInfo.googleClientId}</div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-100 rounded border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800">Instructions:</h4>
              <p className="text-yellow-700 text-xs mt-1">
                Copy the "Redirect URI" above and add it exactly to your Google Cloud Console OAuth 2.0 Client ID configuration.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
