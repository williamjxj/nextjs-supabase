'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { testConnection } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ])
  }

  const testSupabaseConnection = async () => {
    addResult('🔗 Testing Supabase connection...')
    try {
      const isConnected = await testConnection()
      addResult(
        isConnected ? '✅ Connection successful' : '❌ Connection failed'
      )
    } catch (error) {
      addResult(`❌ Connection error: ${error}`)
    }
  }

  const testAuthEndpoint = async () => {
    addResult('🔐 Testing auth endpoint...')
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`
      )
      addResult(`📡 Auth endpoint status: ${response.status}`)
      if (response.ok) {
        addResult('✅ Auth endpoint is accessible')
      } else {
        addResult('❌ Auth endpoint returned error')
      }
    } catch (error) {
      addResult(`❌ Auth endpoint error: ${error}`)
    }
  }

  const testSignIn = async () => {
    addResult('🔐 Testing sign in...')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jxjwilliam1@2925.com',
        password: 'William1!',
      })

      if (error) {
        addResult(`❌ Sign in error: ${error.message}`)
      } else {
        addResult(`✅ Sign in successful: ${data.user?.id}`)
      }
    } catch (error) {
      addResult(`❌ Sign in failed: ${error}`)
    }
  }

  const testGitHubOAuth = async () => {
    addResult('🐙 Testing GitHub OAuth...')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        addResult(`❌ GitHub OAuth error: ${error.message}`)
      } else {
        addResult(`✅ GitHub OAuth initiated: ${data.url}`)
        addResult('🔄 Redirecting to GitHub...')
      }
    } catch (error) {
      addResult(`❌ GitHub OAuth failed: ${error}`)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const clearBrowserCache = () => {
    addResult('🧹 Clearing browser cache...')
    try {
      // Clear localStorage
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith('sb-') || key.includes('supabase')
      )
      keys.forEach(key => localStorage.removeItem(key))
      addResult(`✅ Cleared ${keys.length} localStorage items`)

      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(
        key => key.startsWith('sb-') || key.includes('supabase')
      )
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
      addResult(`✅ Cleared ${sessionKeys.length} sessionStorage items`)

      addResult('✅ Browser cache cleared - try login again')
    } catch (error) {
      addResult(`❌ Cache clear error: ${error}`)
    }
  }

  const checkAuthState = async () => {
    addResult('🔍 Checking auth state...')
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()

      if (response.ok) {
        addResult(
          `✅ Current user: ${data.currentUser.email} (${data.currentUser.provider})`
        )
        addResult(`� Profile exists: ${!!data.database.profile}`)
        addResult(`� Total profiles: ${data.allProfiles.data.length}`)

        if (data.currentUser.user_metadata) {
          addResult(
            `� User metadata: ${JSON.stringify(data.currentUser.user_metadata)}`
          )
        }
        if (data.currentUser.app_metadata) {
          addResult(
            `� App metadata: ${JSON.stringify(data.currentUser.app_metadata)}`
          )
        }
      } else {
        addResult(`❌ Auth check failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ Auth check error: ${error}`)
    }
  }

  const fixProfile = async () => {
    addResult('🔧 Attempting to fix profile...')
    try {
      const response = await fetch('/api/debug/fix-profiles', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        addResult(`✅ ${data.message}`)
        if (data.profile) {
          addResult(
            `👤 Profile: ${data.profile.email} (${data.profile.provider})`
          )
        }
      } else {
        addResult(`❌ Profile fix failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ Profile fix error: ${error}`)
    }
  }

  const debugGitHubOAuth = async () => {
    addResult('🔍 Debugging GitHub OAuth configuration...')
    try {
      const response = await fetch('/api/debug/github-oauth', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        addResult(`🌐 Environment: ${data.environment.supabaseUrl}`)
        addResult(`🔑 Has anon key: ${data.environment.hasAnonKey}`)
        addResult(`🏠 Auth URL: ${data.environment.authUrl}`)

        if (data.currentUser) {
          addResult(
            `👤 Current user: ${data.currentUser.email} (${data.currentUser.provider})`
          )
        } else {
          addResult(`👤 No current user`)
        }
      } else {
        addResult(`❌ GitHub OAuth debug failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ GitHub OAuth debug error: ${error}`)
    }
  }

  const testOAuthProfile = async () => {
    addResult('🧪 Testing OAuth profile creation...')
    try {
      const response = await fetch('/api/debug/oauth-test', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        addResult(`✅ User: ${data.user.email} (${data.user.provider})`)
        addResult(`👤 Profile exists: ${!!data.profile}`)
        addResult(`🔧 Profile created: ${data.profileCreated}`)

        if (data.user.user_metadata) {
          addResult(
            `📋 User metadata: ${JSON.stringify(data.user.user_metadata)}`
          )
        }
        if (data.createError) {
          addResult(`❌ Create error: ${data.createError}`)
        }
      } else {
        addResult(`❌ OAuth test failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ OAuth test error: ${error}`)
    }
  }

  const compareOAuthProviders = async () => {
    addResult('🔍 Comparing OAuth providers...')
    try {
      const response = await fetch('/api/debug/oauth-comparison')
      const data = await response.json()

      if (response.ok) {
        addResult(
          `👤 Current user: ${data.currentUser.email} (${data.currentUser.provider})`
        )
        addResult(`📊 Has profile: ${data.comparison.hasProfile}`)
        addResult(`🔗 Providers match: ${data.comparison.providersMatch}`)
        addResult(`📈 Total OAuth profiles: ${data.allOAuthProfiles.length}`)

        // Show breakdown by provider
        const googleProfiles = data.allOAuthProfiles.filter(
          (p: any) => p.provider === 'google'
        ).length
        const githubProfiles = data.allOAuthProfiles.filter(
          (p: any) => p.provider === 'github'
        ).length
        addResult(
          `📊 Google profiles: ${googleProfiles}, GitHub profiles: ${githubProfiles}`
        )

        if (data.profileError) {
          addResult(`❌ Profile error: ${data.profileError}`)
        }
      } else {
        addResult(`❌ OAuth comparison failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ OAuth comparison error: ${error}`)
    }
  }

  const testSubscriptionCreation = async () => {
    addResult('💳 Testing subscription creation...')
    try {
      const response = await fetch('/api/debug/test-subscription', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        addResult(`✅ Subscription test: ${data.message}`)
        addResult(`📋 Subscription ID: ${data.subscriptionId}`)
        addResult(`👤 User: ${data.user.email}`)

        if (data.subscription) {
          addResult(
            `📊 Plan: ${data.subscription.plan_type} (${data.subscription.billing_interval})`
          )
          addResult(`📅 Status: ${data.subscription.status}`)
        }

        if (data.fetchError) {
          addResult(`⚠️ Fetch error: ${data.fetchError}`)
        }
      } else {
        addResult(`❌ Subscription test failed: ${data.error}`)
        if (data.details) {
          addResult(`📋 Details: ${data.details}`)
        }
      }
    } catch (error) {
      addResult(`❌ Subscription test error: ${error}`)
    }
  }

  const cleanupTestSubscriptions = async () => {
    addResult('🗑️ Cleaning up test subscriptions...')
    try {
      const response = await fetch('/api/debug/test-subscription', {
        method: 'DELETE',
      })
      const data = await response.json()

      if (response.ok) {
        addResult(`✅ ${data.message}`)
      } else {
        addResult(`❌ Cleanup failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ Cleanup error: ${error}`)
    }
  }

  return (
    <div className='min-h-screen p-8'>
      <Card className='max-w-4xl mx-auto'>
        <CardHeader>
          <CardTitle>🔧 Supabase Debug Console</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2 flex-wrap'>
            <Button onClick={testSupabaseConnection}>Test Connection</Button>
            <Button onClick={testAuthEndpoint}>Test Auth Endpoint</Button>
            <Button onClick={testSignIn}>Test Sign In</Button>
            <Button onClick={testGitHubOAuth} variant='secondary'>
              Test GitHub OAuth
            </Button>
            <Button onClick={checkAuthState} variant='secondary'>
              Check Auth State
            </Button>
            <Button onClick={fixProfile} variant='secondary'>
              Fix Profile
            </Button>
            <Button onClick={debugGitHubOAuth} variant='secondary'>
              Debug GitHub
            </Button>
            <Button onClick={testOAuthProfile} variant='secondary'>
              Test OAuth Profile
            </Button>
            <Button onClick={compareOAuthProviders} variant='secondary'>
              Compare OAuth
            </Button>
            <Button onClick={testSubscriptionCreation} variant='secondary'>
              Test Subscription
            </Button>
            <Button onClick={cleanupTestSubscriptions} variant='outline'>
              Cleanup Tests
            </Button>
            <Button onClick={clearBrowserCache} variant='secondary'>
              Clear Cache
            </Button>
            <Button onClick={clearResults} variant='outline'>
              Clear
            </Button>
          </div>

          <div className='bg-gray-100 p-4 rounded-lg min-h-[300px] font-mono text-sm'>
            <div className='font-bold mb-2'>Debug Output:</div>
            {results.length === 0 ? (
              <div className='text-gray-500'>
                Click a test button to see results...
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className='mb-1'>
                  {result}
                </div>
              ))
            )}
          </div>

          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='font-bold mb-2'>Environment Info:</div>
            <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
            <div>
              Anon Key:{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
