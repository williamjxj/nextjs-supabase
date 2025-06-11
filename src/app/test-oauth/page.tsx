'use client'

import { useEffect, useState } from 'react'
import { testGoogleOAuthConfig, debugOAuthError, getRequiredRedirectURIs } from '@/utils/test-google-oauth'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export default function TestOAuthPage() {
  const [config, setConfig] = useState<any>(null)
  const [serverConfig, setServerConfig] = useState<any>(null)
  const { signInWithSocial } = useAuth()

  useEffect(() => {
    const oauthConfig = testGoogleOAuthConfig()
    setConfig(oauthConfig)
    debugOAuthError()
    
    // Fetch server-side configuration
    fetch('/api/debug-oauth')
      .then(res => res.json())
      .then(data => setServerConfig(data))
      .catch(err => console.error('Failed to fetch server config:', err))
  }, [])

  const handleTestGoogleAuth = async () => {
    try {
      console.log('🚀 Testing Google OAuth...')
      await signInWithSocial('google')
    } catch (error) {
      console.error('❌ Google OAuth test failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Google OAuth Configuration Test</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold mb-3">Current Configuration</h2>
          {config && (
            <div className="space-y-2 text-sm">
              <div><strong>Supabase URL:</strong> {config.supabaseUrl}</div>
              <div><strong>Expected Redirect URI:</strong> {config.expectedRedirectUri}</div>
              <div><strong>Google Client ID (Client-side):</strong> {config.googleClientId}</div>
              <div><strong>Current Client ID:</strong> {config.currentClientId}</div>
              <div><strong>Note:</strong> {config.note}</div>
            </div>
          )}
          
          {serverConfig && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <h3 className="font-medium mb-2">Server-side Configuration:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Google Client ID:</strong> {serverConfig.envVarsStatus.clientId} {serverConfig.googleClientId ? `(${serverConfig.googleClientId.substring(0, 20)}...)` : ''}</div>
                <div><strong>Google Secret:</strong> {serverConfig.hasGoogleSecret ? '✅ Present' : '❌ Missing'} {serverConfig.googleSecretLength > 0 ? `(${serverConfig.googleSecretLength} chars)` : ''}</div>
                <div><strong>Environment Status:</strong> Client ID: {serverConfig.envVarsStatus.clientId}, Secret: {serverConfig.envVarsStatus.secret}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold mb-3">Required Redirect URIs</h2>
          <p className="text-sm mb-3">Add these exact URIs to your Google Cloud Console OAuth 2.0 Client ID:</p>
          <div className="space-y-1">
            {getRequiredRedirectURIs().map((uri, index) => (
              <div key={index} className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {uri}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold mb-3">Test OAuth Flow</h2>
          <p className="text-sm mb-3">Click the button below to test Google OAuth after configuring the redirect URIs.</p>
          <Button onClick={handleTestGoogleAuth} className="bg-red-600 hover:bg-red-700 text-white">
            🚀 Test Google OAuth
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google Cloud Console</a></li>
            <li>Navigate to <strong>APIs & Services</strong> → <strong>Credentials</strong></li>
            <li>Find OAuth 2.0 Client ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">{config?.currentClientId}</code></li>
            <li>Add the redirect URIs shown above</li>
            <li>Save and wait 1-2 minutes for changes to propagate</li>
            <li>Test the OAuth flow using the button above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
