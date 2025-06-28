'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  CheckCircle,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Crown,
  Settings,
  ExternalLink,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import PayPalSubscriptionHandler from '@/components/paypal/paypal-subscription-handler'
import StripeSubscriptionHandler from '@/components/stripe/stripe-subscription-handler'
import Link from 'next/link'

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { user, loading } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchSubscription()
    }

    // Handle success/error notifications
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true') {
      showToast('Subscription updated successfully!', 'success', 'Success')
    } else if (error) {
      showToast(`Error: ${error}`, 'error', 'Error')
    }
  }, [user, loading, router, searchParams, showToast])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const handleStripePortal = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (error) {
      showToast('Failed to open billing portal', 'error', 'Error')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading || loadingSubscription) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const currentPlan = subscription
    ? SUBSCRIPTION_PLANS[
        subscription.plan_type as keyof typeof SUBSCRIPTION_PLANS
      ]
    : null

  return (
    <div className='min-h-screen bg-gray-50'>
      <PayPalSubscriptionHandler />
      <StripeSubscriptionHandler />

      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <Link href='/account'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Account
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Subscription Management
            </h1>
            <p className='text-gray-600'>
              Manage your subscription and billing
            </p>
          </div>
        </div>

        {/* Success/Error Notifications */}
        {searchParams.get('success') === 'true' && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center'>
              <CheckCircle className='w-5 h-5 text-green-600 mr-2' />
              <p className='text-green-800 font-medium'>
                Subscription updated successfully!
              </p>
            </div>
          </div>
        )}

        {searchParams.get('error') && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center'>
              <AlertTriangle className='w-5 h-5 text-red-600 mr-2' />
              <p className='text-red-800 font-medium'>
                Error: {searchParams.get('error')}
              </p>
            </div>
          </div>
        )}

        {!subscription ? (
          /* No Subscription */
          <Card className='p-8 text-center'>
            <AlertTriangle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
              No Active Subscription
            </h2>
            <p className='text-gray-600 mb-6'>
              Subscribe to get unlimited access to our premium gallery
            </p>
            <Link href='/membership'>
              <Button>
                <Crown className='w-4 h-4 mr-2' />
                View Plans
              </Button>
            </Link>
          </Card>
        ) : (
          /* Active Subscription */
          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Main Subscription Info */}
            <div className='lg:col-span-2'>
              <Card className='p-6 mb-6'>
                <div className='flex items-center gap-4 mb-6'>
                  <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                    <Crown className='w-6 h-6 text-purple-600' />
                  </div>
                  <div>
                    <h2 className='text-2xl font-semibold text-gray-900'>
                      {currentPlan?.name || subscription.plan_type} Plan
                    </h2>
                    <p className='text-gray-600 capitalize'>
                      Status: {subscription.status}
                    </p>
                  </div>
                </div>

                {/* Subscription Details Grid */}
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Plan Type
                    </label>
                    <p className='text-lg font-semibold text-gray-900 capitalize'>
                      {subscription.plan_type || 'Standard'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {currentPlan?.name || 'Standard Plan'}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Price
                    </label>
                    <p className='text-lg font-semibold text-gray-900'>
                      {formatCurrency(
                        subscription.billing_interval === 'yearly'
                          ? subscription.price_yearly ||
                              currentPlan?.priceYearly ||
                              0
                          : subscription.price_monthly ||
                              currentPlan?.priceMonthly ||
                              0
                      )}
                    </p>
                    <p className='text-sm text-gray-600'>
                      per{' '}
                      {subscription.billing_interval === 'yearly'
                        ? 'year'
                        : 'month'}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Billing Cycle
                    </label>
                    <p className='text-lg font-semibold text-gray-900 capitalize'>
                      {subscription.billing_interval || 'Monthly'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {subscription.billing_interval === 'yearly'
                        ? 'Billed annually'
                        : 'Billed monthly'}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Next Billing
                    </label>
                    <p className='text-lg font-semibold text-gray-900'>
                      {subscription.current_period_end
                        ? formatDate(subscription.current_period_end)
                        : 'N/A'}
                    </p>
                    <p className='text-sm text-gray-600'>Automatic renewal</p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Started
                    </label>
                    <p className='text-lg font-semibold text-gray-900'>
                      {subscription.created_at
                        ? formatDate(subscription.created_at)
                        : subscription.current_period_start
                          ? formatDate(subscription.current_period_start)
                          : 'N/A'}
                    </p>
                    <p className='text-sm text-gray-600'>Subscription date</p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Status
                    </label>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          subscription.status === 'active'
                            ? 'bg-green-500'
                            : subscription.status === 'past_due'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      ></div>
                      <p className='text-lg font-semibold text-gray-900 capitalize'>
                        {subscription.status}
                      </p>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {subscription.status === 'active'
                        ? 'All systems go'
                        : subscription.status === 'past_due'
                          ? 'Payment needed'
                          : 'Requires attention'}
                    </p>
                  </div>
                </div>

                <div className='mb-6'>
                  <label className='text-sm font-medium text-gray-500'>
                    Payment Method
                  </label>
                  <div className='flex items-center gap-2 mt-1'>
                    <CreditCard className='w-4 h-4 text-gray-600' />
                    <span className='text-gray-900 capitalize'>
                      {subscription.payment_provider || 'Stripe'}
                    </span>
                  </div>
                </div>

                {currentPlan?.features && (
                  <div>
                    <label className='text-sm font-medium text-gray-500 mb-3 block'>
                      Plan Features
                    </label>
                    <ul className='space-y-2'>
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className='flex items-center gap-2'>
                          <CheckCircle className='w-4 h-4 text-green-500' />
                          <span className='text-gray-700'>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar Actions - Compact */}
            <div className='space-y-4'>
              <Card className='p-4'>
                <h3 className='text-base font-semibold text-gray-900 mb-3'>
                  Quick Actions
                </h3>
                <div className='space-y-2'>
                  {subscription.payment_provider === 'stripe' && (
                    <Button
                      onClick={handleStripePortal}
                      size='sm'
                      className='w-full'
                    >
                      <ExternalLink className='w-3 h-3 mr-2' />
                      Billing Portal
                    </Button>
                  )}

                  <Link href='/membership' className='block'>
                    <Button variant='outline' size='sm' className='w-full'>
                      <Settings className='w-3 h-3 mr-2' />
                      Change Plan
                    </Button>
                  </Link>

                  <Button variant='outline' size='sm' className='w-full'>
                    <Mail className='w-3 h-3 mr-2' />
                    Contact Support
                  </Button>
                </div>
              </Card>

              {/* Subscription Summary */}
              <Card className='p-4'>
                <h3 className='text-base font-semibold text-gray-900 mb-3'>
                  Summary
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Plan:</span>
                    <span className='font-medium capitalize'>
                      {subscription.plan_type}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Billing:</span>
                    <span className='font-medium capitalize'>
                      {subscription.billing_interval}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span
                      className={`font-medium capitalize ${
                        subscription.status === 'active'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
