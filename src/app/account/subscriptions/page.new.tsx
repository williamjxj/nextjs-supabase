'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useSubscription } from '@/hooks/use-subscription'
import { SubscriptionType } from '@/lib/stripe'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const {
    loading,
    subscription,
    products,
    error,
    isActive,
    isPastDue,
    isExpired,
    currentPeriodEnd,
    cancelSubscription,
  } = useSubscription()

  const [cancelling, setCancelling] = useState(false)

  // Derive grace period from the available data
  const isGracePeriod = isPastDue && !(isExpired ?? true)

  // Map current subscription to type for comparison
  const currentSubscriptionType = (() => {
    if (!subscription?.prices?.products?.name) return null
    
    const productNameMap: Record<string, SubscriptionType> = {
      'Basic Plan': 'standard',
      'Pro Plan': 'premium',
      'Premium Plan': 'commercial'
    }
    
    return productNameMap[subscription.prices.products.name] || null
  })()

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
      )
    ) {
      return
    }

    setCancelling(true)
    const { success, error } = await cancelSubscription()
    setCancelling(false)

    if (success) {
      showToast(
        'Your subscription has been cancelled and will end at the current billing period.',
        'success'
      )
    } else {
      showToast(error || 'Failed to cancel subscription', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency = 'usd') => {
    // Convert from cents to dollars if amount is in cents
    const displayAmount = amount > 100 ? amount / 100 : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(displayAmount)
  }

  if (loading) {
    return (
      <div className='container max-w-4xl mx-auto py-12 px-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center justify-center py-12'>
          <div className='w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin'></div>
          <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
            Loading subscription details...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container max-w-4xl mx-auto py-12 px-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center justify-center py-12'>
          <AlertTriangle className='w-16 h-16 text-red-500 mb-4' />
          <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
            Error Loading Subscription
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300 mb-6'>
            {error}
          </p>
          <Button onClick={() => router.push('/pricing')}>
            View Pricing Plans
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900 dark:text-white'>
        Manage Subscription
      </h1>

      {!subscription ? (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8'>
          <div className='flex flex-col items-center justify-center py-6'>
            <XCircle className='w-16 h-16 text-gray-400 mb-4' />
            <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-4'>
              No Active Subscription
            </h2>
            <p className='text-gray-600 dark:text-gray-300 mb-6 text-center'>
              You don&apos;t currently have an active subscription. Subscribe to
              get full access to our gallery.
            </p>
            <Button onClick={() => router.push('/pricing')}>
              View Pricing Plans
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white'>
                Current Subscription
              </h2>
              <div className='flex items-center'>
                {isActive && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-2'>
                    <CheckCircle className='w-4 h-4 mr-1' />
                    Active
                  </span>
                )}
                {isGracePeriod && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mr-2'>
                    <AlertTriangle className='w-4 h-4 mr-1' />
                    Cancelling
                  </span>
                )}
                {!isActive && !isGracePeriod && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mr-2'>
                    <XCircle className='w-4 h-4 mr-1' />
                    {subscription.status || 'Inactive'}
                  </span>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-lg font-medium text-gray-800 dark:text-white'>
                      {subscription.prices?.products?.name || 'Unknown Plan'}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      {subscription.prices?.products?.description || ''}
                    </p>
                  </div>

                  <div className='flex items-center text-gray-600 dark:text-gray-300'>
                    <CreditCard className='w-5 h-5 mr-2' />
                    <span>
                      {formatCurrency(
                        subscription.prices?.unit_amount || 0,
                        subscription.prices?.currency || 'usd'
                      )}{' '}
                      / {subscription.prices?.interval || 'month'}
                    </span>
                  </div>

                  <div className='flex items-center text-gray-600 dark:text-gray-300'>
                    <Calendar className='w-5 h-5 mr-2' />
                    <span>
                      {isGracePeriod
                        ? `Cancels on ${formatDate(subscription.current_period_end)}`
                        : `Next billing date: ${formatDate(subscription.current_period_end)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col justify-end space-y-3'>
                {isActive && (
                  <>
                    <Button
                      onClick={() => router.push('/pricing')}
                      variant='outline'
                      className='w-full'
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Change Plan
                    </Button>
                    <Button
                      onClick={handleCancelSubscription}
                      variant='destructive'
                      className='w-full'
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                  </>
                )}

                {isGracePeriod && (
                  <div className='bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg'>
                    <p className='text-yellow-800 dark:text-yellow-200 text-sm'>
                      Your subscription will be canceled on{' '}
                      {formatDate(subscription.current_period_end)}. You can
                      reactivate it before this date.
                    </p>
                    <Button
                      onClick={() => router.push('/pricing')}
                      variant='outline'
                      className='mt-3 w-full'
                    >
                      Reactivate Subscription
                    </Button>
                  </div>
                )}

                {isExpired && (
                  <Button
                    onClick={() => router.push('/pricing')}
                    className='w-full'
                  >
                    Renew Subscription
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Available Plans Section */}
          {products.length > 0 && (
            <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-6'>
                Available Plans
              </h2>
              <div className='grid md:grid-cols-3 gap-4'>
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 ${
                      subscription.prices?.products?.id === product.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <h4 className='font-medium text-gray-800 dark:text-white'>
                        {product.name}
                      </h4>
                      {subscription.prices?.products?.id === product.id && (
                        <span className='text-xs bg-blue-100 dark:bg-blue-700 text-blue-600 dark:text-blue-300 px-2 py-1 rounded'>
                          Current
                        </span>
                      )}
                    </div>
                    <p className='text-gray-600 dark:text-gray-300 text-sm mb-2'>
                      {product.description}
                    </p>
                    {product.prices && product.prices.length > 0 && (
                      <p className='text-gray-600 dark:text-gray-300 text-sm'>
                        {formatCurrency(
                          product.prices[0].unit_amount || 0,
                          product.prices[0].currency || 'usd'
                        )}{' '}
                        / {product.prices[0].interval || 'month'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className='mt-6'>
                <Button
                  onClick={() => router.push('/pricing')}
                  className='w-full'
                >
                  View All Plans & Change Subscription
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
