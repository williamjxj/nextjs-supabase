'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function AuthTestPage() {
  const { user, loading, mounted } = useAuth()
  const [tabId] = useState(() => Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    // Set a unique tab name for debugging
    window.name = `tab-${tabId}`
  }, [tabId])

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Cross-Tab Auth Test</h1>

      <div className='space-y-4'>
        <div className='bg-gray-100 p-4 rounded-lg'>
          <h2 className='font-semibold mb-2'>Current Auth State</h2>
          <div className='space-y-1 text-sm font-mono'>
            <div>Tab ID: {tabId}</div>
            <div>Mounted: {mounted ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '🔄' : '✅'}</div>
            <div>User: {user ? `✅ ${user.email}` : '❌ Not logged in'}</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <div className='bg-blue-50 p-4 rounded-lg'>
          <h2 className='font-semibold mb-2'>Test Instructions</h2>
          <ol className='list-decimal list-inside space-y-1 text-sm'>
            <li>Open this page in multiple tabs</li>
            <li>Login in one tab using credentials</li>
            <li>Check if other tabs show the login state</li>
            <li>Try switching between tabs to trigger focus events</li>
            <li>Logout in one tab and check other tabs</li>
          </ol>
        </div>

        <div className='bg-yellow-50 p-4 rounded-lg'>
          <h2 className='font-semibold mb-2'>What to Watch For</h2>
          <ul className='list-disc list-inside space-y-1 text-sm'>
            <li>Auth state should sync automatically across tabs</li>
            <li>Focus events should trigger auth state checks</li>
            <li>Storage events should sync login/logout</li>
            <li>Navigation should appear/disappear consistently</li>
          </ul>
        </div>

        {user && (
          <div className='bg-green-50 p-4 rounded-lg'>
            <h2 className='font-semibold mb-2'>✅ Logged In</h2>
            <div className='text-sm'>
              <div>Email: {user.email}</div>
              <div>ID: {user.id}</div>
              <div>
                Has Subscription: {user.hasActiveSubscription ? '✅' : '❌'}
              </div>
            </div>
          </div>
        )}

        {!user && !loading && mounted && (
          <div className='bg-red-50 p-4 rounded-lg'>
            <h2 className='font-semibold mb-2'>❌ Not Logged In</h2>
            <p className='text-sm'>
              Go to{' '}
              <a href='/login' className='text-blue-600 underline'>
                /login
              </a>{' '}
              to test credential login.
            </p>
          </div>
        )}

        <div className='text-xs text-gray-500 mt-4'>
          <p>Check browser console for detailed auth sync logs.</p>
        </div>
      </div>
    </div>
  )
}
