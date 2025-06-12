'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { createStripePortal } from '@/lib/actions/subscription-simplified'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper function to format currency
const formatCurrency = (amount: number, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading } = useAuth()
  const [cancelling, setCancelling] = useState(false)

  const subscription = user?.subscription
  const isActive = subscription?.status === 'active'
  const isExpired = subscription?.status === 'expired'
  const isCancelled = subscription?.status === 'cancelled'

  const handleManageSubscription = async () => {
    try {
      await createStripePortal('/account/subscriptions')
    } catch (error: any) {
      showToast(
        error.message || 'Failed to open billing portal',
        'error',
        'Error'
      )
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    setCancelling(true)
    try {
      // This would need to be implemented - for now just show a message
      showToast(
        'Please contact support to cancel your subscription.',
        'info',
        'Cancellation Request'
      )
    } catch (error: any) {
      showToast(
        error.message || 'Failed to cancel subscription',
        'error',
        'Error'
      )
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-6'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className='container mx-auto p-6'>
        <h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-8'>
          Subscription Management
        </h1>
        <div className='text-center py-12'>
          <AlertTriangle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>
            No Active Subscription
          </h2>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            Subscribe to a plan to get full access to our gallery.
          </p>
          <Button onClick={() => router.push('/membership')}>
            View Pricing Plans
          </Button>
        </div>
      </div>
    )
  }

  const currentPlan = SUBSCRIPTION_PLANS[subscription.plan_type]

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-8'>
        Subscription Management
      </h1>

      <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-semibold text-gray-800 dark:text-white'>
            Current Subscription
          </h2>
          <div className='flex items-center'>
            {isActive && (
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'>
                <CheckCircle className='w-4 h-4 mr-1' />
                Active
              </span>
            )}
            {isCancelled && (
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'>
                <XCircle className='w-4 h-4 mr-1' />
                Cancelled
              </span>
            )}
            {isExpired && (
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'>
                <XCircle className='w-4 h-4 mr-1' />
                Expired
              </span>
            )}
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          <div>
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-medium text-gray-800 dark:text-white'>
                  {currentPlan?.name || 'Unknown Plan'}
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  {currentPlan?.description || ''}
                </p>
              </div>

              <div className='flex items-center text-gray-600 dark:text-gray-300'>
                <CreditCard className='w-5 h-5 mr-2' />
                <span>
                  {formatCurrency(
                    subscription.billing_interval === 'yearly'
                      ? subscription.price_yearly
                      : subscription.price_monthly
                  )}{' '}
                  /{' '}
                  {subscription.billing_interval === 'yearly'
                    ? 'year'
                    : 'month'}
                </span>
              </div>

              {subscription.current_period_end && (
                <div className='flex items-center text-gray-600 dark:text-gray-300'>
                  <Calendar className='w-5 h-5 mr-2' />
                  <span>
                    {isCancelled
                      ? `Expires on ${formatDate(subscription.current_period_end)}`
                      : `Next billing date: ${formatDate(subscription.current_period_end)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className='flex flex-col justify-end space-y-3'>
            {isActive && (
              <>
                <Button
                  onClick={() => router.push('/membership')}
                  variant='outline'
                  className='w-full'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Change Plan
                </Button>
                <Button
                  onClick={handleManageSubscription}
                  variant='outline'
                  className='w-full'
                >
                  Manage Billing
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

            {isCancelled && (
              <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4'>
                <p className='text-yellow-800 dark:text-yellow-200 text-sm'>
                  Your subscription will be canceled on{' '}
                  {formatDate(subscription.current_period_end)}. You can
                  reactivate it before this date.
                </p>
                <Button
                  onClick={() => router.push('/membership')}
                  variant='outline'
                  className='mt-3 w-full'
                >
                  Reactivate Subscription
                </Button>
              </div>
            )}

            {isExpired && (
              <Button
                onClick={() => router.push('/membership')}
                className='w-full'
              >
                Renew Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Features included in plan */}
        {currentPlan?.features && (
          <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <h4 className='text-md font-medium text-gray-800 dark:text-white mb-3'>
              Features included:
            </h4>
            <div className='grid md:grid-cols-2 gap-2'>
              {currentPlan.features.map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center text-sm text-gray-600 dark:text-gray-300'
                >
                  <CheckCircle className='w-4 h-4 mr-2 text-green-500' />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Available Plans */}
      <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'>
        <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-6'>
          Available Plans
        </h2>
        <div className='grid md:grid-cols-3 gap-4'>
          {Object.values(SUBSCRIPTION_PLANS).map(plan => (
            <div
              key={plan.type}
              className={`border rounded-lg p-4 ${
                subscription.plan_type === plan.type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className='flex justify-between items-start mb-2'>
                <h4 className='font-medium text-gray-800 dark:text-white'>
                  {plan.name}
                </h4>
                {subscription.plan_type === plan.type && (
                  <span className='text-xs bg-blue-100 dark:bg-blue-700 text-blue-600 dark:text-blue-300 px-2 py-1 rounded'>
                    Current
                  </span>
                )}
              </div>
              <p className='text-gray-600 dark:text-gray-300 text-sm mb-2'>
                {plan.description}
              </p>
              <p className='text-gray-600 dark:text-gray-300 text-sm'>
                {formatCurrency(plan.priceMonthly)} / month
              </p>
            </div>
          ))}
        </div>
        <div className='mt-6'>
          <Button onClick={() => router.push('/membership')} className='w-full'>
            View All Plans & Change Subscription
          </Button>
        </div>
      </Card>
    </div>
  )
}
