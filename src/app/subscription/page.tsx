'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  CheckCircle,
  CreditCard,
  AlertTriangle,
  Crown,
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
      console.log('🔍 Fetching subscription data...')
      const response = await fetch('/api/subscription')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Subscription API response:', data)
        setSubscription(data.subscription)
      } else {
        console.error('❌ Failed to fetch subscription:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || amount === 0) return '$0.00'

    // Handle both cents (Stripe format) and dollars
    const dollarAmount = amount > 100 ? amount / 100 : amount

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollarAmount)
  }

  const formatDate = (dateInput: string | number | Date | null | undefined) => {
    if (!dateInput) return 'Not available'

    try {
      let date: Date

      // Handle different input types
      if (typeof dateInput === 'string') {
        // If it's a string, try to parse it
        date = new Date(dateInput)
      } else if (typeof dateInput === 'number') {
        // If it's a number, treat as timestamp
        // Check if it's in seconds (Unix timestamp) or milliseconds
        date =
          dateInput < 10000000000
            ? new Date(dateInput * 1000)
            : new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'Not available'
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Not available'
      }

      // Check if the date is too old (before 2020) or too far in future (after 2030)
      const year = date.getFullYear()
      if (year < 2020 || year > 2030) {
        return 'Not available'
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateInput)
      return 'Not available'
    }
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

  // Debug subscription data (remove in production)
  if (subscription && process.env.NODE_ENV === 'development') {
    console.log('🐛 Subscription Debug Data:', {
      raw: subscription,
      current_period_end: subscription.current_period_end,
      current_period_end_type: typeof subscription.current_period_end,
      price_monthly: subscription.price_monthly,
      price_yearly: subscription.price_yearly,
      amount: subscription.amount,
      plan_type: subscription.plan_type,
      status: subscription.status,
      billing_interval: subscription.billing_interval,
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <PayPalSubscriptionHandler />
      <StripeSubscriptionHandler />

      <div className='container mx-auto px-4 py-8'>
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
          <Card className='p-8 text-center max-w-md mx-auto'>
            <AlertTriangle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
              No Active Subscription
            </h2>
            <p className='text-gray-600 mb-6'>
              Subscribe to get unlimited access to our premium gallery
            </p>
            <Link href='/membership'>
              <Button className='w-full'>
                <Crown className='w-4 h-4 mr-2' />
                View Plans & Subscribe
              </Button>
            </Link>
          </Card>
        ) : (
          /* Active Subscription */
          <div className='max-w-4xl mx-auto'>
            <Card className='p-6'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center'>
                  <Crown className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h2 className='text-2xl font-semibold text-gray-900'>
                    {currentPlan?.name || subscription.plan_type || 'Standard'}
                  </h2>
                  <p className='text-gray-600 capitalize flex items-center gap-2'>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        subscription.status === 'active'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    ></span>
                    {subscription.status || 'active'}
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
                    {(() => {
                      // Improved price calculation logic
                      const isYearly =
                        subscription.billing_interval === 'yearly' ||
                        subscription.interval === 'year'
                      let price = 0

                      if (isYearly) {
                        price =
                          subscription.price_yearly ||
                          subscription.amount ||
                          currentPlan?.priceYearly ||
                          0
                      } else {
                        price =
                          subscription.price_monthly ||
                          subscription.amount ||
                          currentPlan?.priceMonthly ||
                          0
                      }

                      return formatCurrency(price)
                    })()}
                  </p>
                  <p className='text-sm text-gray-600'>
                    per{' '}
                    {subscription.billing_interval === 'yearly' ||
                    subscription.interval === 'year'
                      ? 'year'
                      : 'month'}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Billing Cycle
                  </label>
                  <p className='text-lg font-semibold text-gray-900 capitalize'>
                    {subscription.billing_interval ||
                      subscription.interval ||
                      'monthly'}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {subscription.billing_interval === 'yearly' ||
                    subscription.interval === 'year'
                      ? 'Billed annually'
                      : 'Billed monthly'}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Next Billing
                  </label>
                  <p className='text-lg font-semibold text-gray-900'>
                    {formatDate(subscription.current_period_end)}
                  </p>
                  <p className='text-sm text-gray-600'>Automatic renewal</p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Started
                  </label>
                  <p className='text-lg font-semibold text-gray-900'>
                    {formatDate(
                      subscription.created_at ||
                        subscription.current_period_start
                    )}
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
                      {subscription.status || 'active'}
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
        )}
      </div>
    </div>
  )
}
