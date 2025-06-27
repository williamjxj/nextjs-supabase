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
