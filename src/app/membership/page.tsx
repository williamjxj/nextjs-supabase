'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

const SUBSCRIPTION_OPTIONS = [
  {
    type: 'standard' as const,
    name: 'Standard Plan',
    price: 9.99,
    period: 'month',
    description: 'Perfect for personal projects and small business use',
    features: [
      'Unlimited thumbnail downloads',
      'Access to standard collection',
      'Personal and commercial use',
      'Digital usage unlimited',
      'Monthly renewal',
    ],
  },
  {
    type: 'premium' as const,
    name: 'Premium Plan',
    price: 19.99,
    period: 'month',
    description: 'Ideal for larger commercial projects and marketing',
    features: [
      'Everything in Standard Plan',
      'Unlimited high-resolution downloads',
      'Access to premium collection',
      'Extended commercial rights',
      'Priority support',
      'Monthly renewal',
    ],
  },
  {
    type: 'commercial' as const,
    name: 'Commercial Plan',
    price: 39.99,
    period: 'month',
    description: 'Full commercial rights for any business use',
    features: [
      'Everything in Premium Plan',
      'Access to entire collection',
      'Full commercial rights',
      'Merchandise and product use',
      'Advertising and marketing',
      'No attribution required',
      'Monthly renewal',
    ],
  },
]

export default function MembershipPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<
    'standard' | 'premium' | 'commercial'
  >('standard')
  const { showToast } = useToast()
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSubscriptionCheckout = async (
    subscriptionType: 'standard' | 'premium' | 'commercial'
  ) => {
    console.log('=== Client-side Debug ===')
    console.log('Loading state:', loading)
    console.log('User state:', !!user)
    console.log('User ID:', user?.id)
    console.log('User email:', user?.email)
    
    // Check if authentication is still loading
    if (loading) {
      showToast('Please wait while we check your login status', 'info')
      return
    }

    // Check if user is authenticated before proceeding
    if (!user) {
      showToast('Please log in to subscribe to a plan', 'error')
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent('/membership')}`)
      return
    }

    try {
      showToast('Processing subscription... (redirecting to checkout)', 'info')
      
      // Double-check authentication with Supabase client before making API call
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Client-side session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionError,
        expiresAt: session?.expires_at
      })
      
      if (!session || sessionError) {
        console.error('No valid session found on client side:', sessionError)
        showToast('Please log in again to subscribe', 'error')
        router.push(`/login?redirect=${encodeURIComponent('/membership')}`)
        return
      }
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionType,
          isSubscription: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific authentication error (backup check)
        if (response.status === 401 && errorData.requireLogin) {
          showToast('Please log in to subscribe to a plan', 'error')
          router.push(`/login?redirect=${encodeURIComponent('/membership')}`)
          return
        }
        
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error initiating subscription checkout:', error)
      showToast(
        `Failed to start subscription: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'error'
      )
    }
  }

  const handleCheckout = () => {
    console.log('=== handleCheckout called ===')
    console.log('User state:', { user: !!user, loading, userId: user?.id })
    console.log('Selected subscription:', selectedSubscription)
    handleSubscriptionCheckout(selectedSubscription)
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Membership Plans</h1>
        <p className='text-muted-foreground'>
          Subscribe once and get unlimited access to download all thumbnails
          within your subscription tier. No need to pay per image!
        </p>
      </div>

      {/* Subscription Options */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {SUBSCRIPTION_OPTIONS.map(option => (
          <div
            key={option.type}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedSubscription === option.type
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSubscription(option.type)}
          >
            <div className='text-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                {option.name}
              </h3>
              <div className='text-3xl font-bold text-blue-600 mb-2'>
                ${option.price.toFixed(2)}/{option.period}
              </div>
              <p className='text-sm text-gray-600'>{option.description}</p>
            </div>

            <ul className='space-y-2'>
              {option.features.map((feature, index) => (
                <li
                  key={index}
                  className='flex items-center text-sm text-gray-700'
                >
                  <svg
                    className='w-4 h-4 text-green-500 mr-2 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {selectedSubscription === option.type && (
              <div className='mt-4 pt-4 border-t border-blue-200'>
                <div className='text-center'>
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                    Selected
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checkout Button */}
      <div className='text-center'>
        {/* Debug button - temporary */}
        <div className='mb-4 space-x-2'>
          <button
            onClick={async () => {
              console.log('=== DEBUG SESSION CHECK ===')
              const { supabase } = await import('@/lib/supabase/client')
              const { data: { session }, error } = await supabase.auth.getSession()
              console.log('Client session:', {
                hasSession: !!session,
                hasUser: !!session?.user,
                userId: session?.user?.id,
                email: session?.user?.email,
                expiresAt: session?.expires_at,
                error
              })
              
              // Also check server session
              const debugResponse = await fetch('/api/debug/session')
              const serverSession = await debugResponse.json()
              console.log('Server session:', serverSession)
            }}
            className='bg-gray-500 text-white px-4 py-2 rounded mb-2'
          >
            Debug Session
          </button>
          
          <button
            onClick={async () => {
              const { createTestUser, signInTestUser } = await import('@/lib/test-auth')
              console.log('Creating test user...')
              await createTestUser()
              console.log('Signing in test user...')
              const result = await signInTestUser()
              if (result) {
                console.log('Test user signed in successfully')
                // Refresh page to update auth state
                window.location.reload()
              }
            }}
            className='bg-green-500 text-white px-4 py-2 rounded mb-2'
          >
            Create & Login Test User
          </button>
        </div>
        {loading ? (
          <Button disabled className='bg-gray-400 text-white px-8 py-3 text-lg'>
            <ShoppingCart className='w-5 h-5 mr-2' />
            Loading...
          </Button>
        ) : !user ? (
          <Button
            onClick={() => {
              console.log('Login button clicked - redirecting to login')
              router.push(`/login?redirect=${encodeURIComponent('/membership')}`)
            }}
            className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg'
          >
            <ShoppingCart className='w-5 h-5 mr-2' />
            Login to Subscribe to{' '}
            {
              SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
                ?.name
            }{' '}
            - $
            {SUBSCRIPTION_OPTIONS.find(
              o => o.type === selectedSubscription
            )?.price.toFixed(2)}
            /
            {
              SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
                ?.period
            }
          </Button>
        ) : (
          <div>
            {/* Debug info */}
            <div className='mb-2 text-sm text-gray-600'>
              Debug: loading={loading.toString()}, user={user ? 'present' : 'null'}, userId={user?.id || 'none'}
            </div>
            <Button
              onClick={() => {
                console.log('Subscribe button clicked - user authenticated:', {
                  user: !!user,
                  loading,
                  userId: user?.id,
                })
                handleCheckout()
              }}
              className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg'
            >
            <ShoppingCart className='w-5 h-5 mr-2' />
            Subscribe to{' '}
            {
              SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
                ?.name
            }{' '}
            - $
            {SUBSCRIPTION_OPTIONS.find(
              o => o.type === selectedSubscription
            )?.price.toFixed(2)}
            /
            {
              SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
                ?.period
            }
          </Button>
          </div>
        )}
      </div>
    </div>
  )
}
