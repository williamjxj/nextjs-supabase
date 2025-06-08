'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useSubscription } from '@/hooks/use-subscription'

function SuccessPageContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { subscription, loading: subscriptionLoading } = useSubscription()

  useEffect(() => {
    async function verifySubscription() {
      try {
        if (!sessionId) {
          setError('Missing session ID')
          setLoading(false)
          return
        }

        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setError('User not authenticated')
          setLoading(false)
          return
        }

        // Wait for subscription hook to load
        if (!subscriptionLoading && !subscription) {
          setError('Subscription not found')
        }

        setLoading(false)
      } catch (err) {
        console.error('Error verifying subscription:', err)
        setError('Failed to verify subscription')
        setLoading(false)
      }
    }

    if (!subscriptionLoading) {
      verifySubscription()
    }
  }, [sessionId, subscription, subscriptionLoading])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'>
        {loading ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin'></div>
            <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
              Verifying your subscription...
            </p>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='w-16 h-16 text-red-500 mb-4' />
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
              Subscription Verification Failed
            </h1>
            <p className='text-lg text-gray-600 dark:text-gray-300 mb-6'>
              {error}
            </p>
            <Button onClick={() => router.push('/membership')}>
              Return to Membership Page
            </Button>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-6'>
            <CheckCircle className='w-16 h-16 text-green-500 mb-4' />
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
              Subscription Activated Successfully!
            </h1>
            <p className='text-lg text-gray-600 dark:text-gray-300 mb-6 text-center'>
              Thank you for subscribing to our{' '}
              {subscription?.subscription_plans?.name || 'membership'} plan.
            </p>

            <div className='w-full max-w-md bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8'>
              <h2 className='text-xl font-semibold mb-4 text-gray-800 dark:text-white'>
                Subscription Details
              </h2>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600 dark:text-gray-300'>
                    Plan:
                  </span>
                  <span className='font-medium text-gray-800 dark:text-white'>
                    {subscription?.subscription_plans?.name || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600 dark:text-gray-300'>
                    Status:
                  </span>
                  <span className='font-medium text-gray-800 dark:text-white capitalize'>
                    {subscription?.status || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600 dark:text-gray-300'>
                    Current Period:
                  </span>
                  <span className='font-medium text-gray-800 dark:text-white'>
                    {formatDate(subscription?.current_period_start || '')} to{' '}
                    {formatDate(subscription?.current_period_end || '')}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600 dark:text-gray-300'>
                    Price:
                  </span>
                  <span className='font-medium text-gray-800 dark:text-white'>
                    ${subscription?.subscription_plans?.price.toFixed(2)}/
                    {subscription?.subscription_plans?.interval || 'month'}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex space-x-4'>
              <Button onClick={() => router.push('/gallery')}>
                Browse Gallery
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push('/account/subscriptions')}
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  )
}
