'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AuthDebugPage() {
  const [authConfig, setAuthConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthConfig = async () => {
      try {
        // Check if we can get the current session
        const { data: session, error: sessionError } =
          await supabase.auth.getSession()

        // Try to get auth settings (this might not work in all environments)
        const config = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasGoogleClientId:
            !!process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
          currentSession: session?.session ? 'active' : 'none',
          sessionError: sessionError?.message || 'none',
          currentUrl: window.location.origin,
          expectedCallbackUrls: [
            `${window.location.origin}/auth/callback`,
            'http://127.0.0.1:54321/auth/v1/callback',
          ],
        }

        setAuthConfig(config)
      } catch (error) {
        console.error('Auth config check failed:', error)
        setAuthConfig({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthConfig()
  }, [])

  const testGoogleOAuth = async () => {
    try {
      console.log('Testing Google OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('OAuth test failed:', error)
        alert(`OAuth test failed: ${error.message}`)
      } else {
        console.log('OAuth test initiated:', data)
      }
    } catch (error) {
      console.error('OAuth test error:', error)
      alert(
        `OAuth test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const testGitHubOAuth = async () => {
    try {
      console.log('Testing GitHub OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('GitHub OAuth test failed:', error)
        alert(`GitHub OAuth test failed: ${error.message}`)
      } else {
        console.log('GitHub OAuth test initiated:', data)
      }
    } catch (error) {
      console.error('GitHub OAuth test error:', error)
      alert(
        `GitHub OAuth test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  if (loading) {
    return <div className='p-8'>Loading auth configuration...</div>
  }

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Auth Debug Information</h1>

      <div className='space-y-6'>
        <div className='bg-gray-100 p-4 rounded-lg'>
          <h2 className='text-lg font-semibold mb-3'>Current Configuration</h2>
          <pre className='text-sm bg-white p-3 rounded border overflow-auto'>
            {JSON.stringify(authConfig, null, 2)}
          </pre>
        </div>

        <div className='bg-blue-50 p-4 rounded-lg'>
          <h2 className='text-lg font-semibold mb-3'>
            Required Google Console Setup
          </h2>
          <p className='mb-3'>
            Add these Authorized redirect URIs to your Google OAuth client:
          </p>
          <ul className='list-disc list-inside space-y-1 font-mono text-sm'>
            <li>http://localhost:3000/auth/callback</li>
            <li>http://127.0.0.1:54321/auth/v1/callback</li>
          </ul>
        </div>

        <div className='space-y-3'>
          <button
            onClick={testGoogleOAuth}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
          >
            Test Google OAuth
          </button>

          <button
            onClick={testGitHubOAuth}
            className='bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded'
          >
            Test GitHub OAuth
          </button>

          <p className='text-sm text-gray-600'>
            Click this button to test the Google OAuth flow. Check the browser
            console for detailed logs.
          </p>
        </div>

        <div className='bg-yellow-50 p-4 rounded-lg'>
          <h2 className='text-lg font-semibold mb-3'>Debugging Steps</h2>
          <ol className='list-decimal list-inside space-y-2 text-sm'>
            <li>
              Click &quot;Test Google OAuth&quot; and check browser console
            </li>
            <li>
              If redirected to Google, check if you can complete the OAuth flow
            </li>
            <li>
              If callback fails, check server logs for &quot;Auth callback
              with:&quot; messages
            </li>
            <li>Verify redirect URIs in Google Console match exactly</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
