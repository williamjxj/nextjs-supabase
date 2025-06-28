'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
  STRIPE_PRICE_IDS,
} from '@/lib/subscription-config'
import {
  Check,
  Star,
  Zap,
  Crown,
  CreditCard,
  DollarSign,
  Bitcoin,
  X,
  ArrowRight,
  CheckCircle,
  Settings,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionHeaderSkeleton } from '@/components/ui/subscription-loading'
import { SubscriptionHeader } from '@/components/subscription/subscription-header'
import Link from 'next/link'

// Payment method type
type PaymentMethod = 'stripe' | 'paypal' | 'crypto'

interface SubscribeModalState {
  isOpen: boolean
  planType: SubscriptionPlanType | null
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  )
  const [subscribeModal, setSubscribeModal] = useState<SubscribeModalState>({
    isOpen: false,
    planType: null,
  })
  const [loading, setLoading] = useState<PaymentMethod | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const { showToast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchSubscription()
    } else {
      setLoadingSubscription(false)
    }
  }, [user])

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

  const handleSubscribeClick = (planType: SubscriptionPlanType) => {
    if (!user) {
      showToast('Please sign in to subscribe', 'info', 'Sign In Required')
      router.push('/login')
      return
    }
    setSubscribeModal({ isOpen: true, planType })
  }

  const closeSubscribeModal = () => {
    setSubscribeModal({ isOpen: false, planType: null })
    setLoading(null)
  }

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (!subscribeModal.planType || !user) return

    setLoading(method)
    try {
      const planType = subscribeModal.planType

      switch (method) {
        case 'stripe':
          // Get the correct Stripe price ID based on plan type and billing interval
          const priceId = STRIPE_PRICE_IDS[planType]?.[billingInterval]

          if (!priceId) {
            console.error('❌ Stripe price ID not found:', {
              planType,
              billingInterval,
              available: STRIPE_PRICE_IDS,
            })
            throw new Error(
              `Stripe price ID not configured for ${planType} ${billingInterval} plan`
            )
          }

          console.log('🎯 Creating Stripe checkout session:', {
            planType,
            billingInterval,
            priceId,
          })

          const stripeResponse = await fetch(
            '/api/stripe/checkout/subscription',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                priceId,
                successUrl: `${window.location.origin}/subscription?success=true`,
                cancelUrl: `${window.location.origin}/membership`,
              }),
            }
          )

          console.log('📡 Stripe API response status:', stripeResponse.status)

          if (!stripeResponse.ok) {
            const errorData = await stripeResponse.json()
            console.error('❌ Stripe API error:', errorData)
            throw new Error(
              errorData.error || 'Failed to create Stripe checkout session'
            )
          }

          const stripeData = await stripeResponse.json()
          console.log('✅ Stripe session created:', stripeData.sessionId)

          if (stripeData.sessionId) {
            console.log('🔄 Redirecting to Stripe checkout...')
            const stripe = (await import('@stripe/stripe-js')).loadStripe(
              process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
            )
            const stripeInstance = await stripe
            if (stripeInstance) {
              const { error } = await stripeInstance.redirectToCheckout({
                sessionId: stripeData.sessionId,
              })
              if (error) {
                console.error('❌ Stripe redirect error:', error)
                throw new Error(error.message)
              }
            } else {
              throw new Error('Failed to load Stripe')
            }
          } else {
            throw new Error('No session ID returned from Stripe')
          }
          break

        case 'paypal':
          localStorage.setItem('paypal_plan_type', planType)
          localStorage.setItem('paypal_billing_interval', billingInterval)
          localStorage.setItem('paypal_user_id', user.id)

          const paypalResponse = await fetch(
            '/api/paypal/subscription-fallback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                planType,
                billingInterval,
                userId: user.id,
                userEmail: user.email,
              }),
            }
          )

          if (!paypalResponse.ok) {
            throw new Error('Failed to create PayPal checkout')
          }

          const paypalData = await paypalResponse.json()
          if (paypalData.approvalUrl) {
            window.location.href = paypalData.approvalUrl
          }
          break

        case 'crypto':
          const cryptoResponse = await fetch('/api/crypto/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              planType,
              billingInterval,
            }),
          })

          if (!cryptoResponse.ok) {
            throw new Error('Failed to create crypto payment')
          }

          const cryptoData = await cryptoResponse.json()
          if (cryptoData.hosted_url) {
            window.location.href = cryptoData.hosted_url
          }
          break
      }
    } catch (error) {
      console.error('Payment error:', error)
      showToast(
        error instanceof Error ? error.message : 'Payment failed',
        'error',
        'Payment Error'
      )
    } finally {
      setLoading(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

  // Check if user has active subscription
  const hasActiveSubscription = subscription && subscription.status === 'active'
  const currentPlan = subscription
    ? SUBSCRIPTION_PLANS[
        subscription.plan_type as keyof typeof SUBSCRIPTION_PLANS
      ]
    : null

  // Debug subscription data (remove in production)
  if (subscription && process.env.NODE_ENV === 'development') {
    console.log('Subscription data:', {
      current_period_end: subscription.current_period_end,
      current_period_end_type: typeof subscription.current_period_end,
      plan_type: subscription.plan_type,
      status: subscription.status,
      billing_interval: subscription.billing_interval,
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        {loadingSubscription ? (
          <SubscriptionHeaderSkeleton hasSubscription={!!user} />
        ) : hasActiveSubscription ? (
          /* Subscribed User Header */
          <Suspense
            fallback={<SubscriptionHeaderSkeleton hasSubscription={true} />}
          >
            <SubscriptionHeader
              subscription={subscription}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </Suspense>
        ) : (
          /* Non-subscribed User Header */
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              Choose Your Plan
            </h1>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Get unlimited access to our premium gallery with flexible pricing
              designed to fit your needs.
            </p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className='flex items-center justify-center mb-12'>
          <div className='flex items-center gap-4 bg-white rounded-full p-2 shadow-sm border'>
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                'px-6 py-2 rounded-full font-medium transition-all duration-200',
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                'px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2',
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Yearly
              <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className='grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12'>
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const planType = key as SubscriptionPlanType
            const isPopular = planType === 'premium'
            const price =
              billingInterval === 'yearly'
                ? plan.priceYearly
                : plan.priceMonthly
            const monthlyPrice =
              billingInterval === 'yearly' ? plan.priceYearly / 12 : price

            return (
              <div
                key={planType}
                className={cn(
                  'relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl',
                  isPopular
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {isPopular && (
                  <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                    <div className='bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1'>
                      <Star className='w-4 h-4' />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className='p-8'>
                  <div className='text-center mb-8'>
                    <div className='flex justify-center mb-4'>
                      {planType === 'standard' && (
                        <CreditCard className='w-12 h-12 text-blue-500' />
                      )}
                      {planType === 'premium' && (
                        <Zap className='w-12 h-12 text-purple-500' />
                      )}
                      {planType === 'commercial' && (
                        <Crown className='w-12 h-12 text-yellow-500' />
                      )}
                    </div>
                    <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                      {plan.name}
                    </h3>
                    <p className='text-gray-600 mb-4'>{plan.description}</p>
                    <div className='mb-4'>
                      <span className='text-4xl font-bold text-gray-900'>
                        {formatCurrency(monthlyPrice)}
                      </span>
                      <span className='text-gray-600'>/month</span>
                      {billingInterval === 'yearly' && (
                        <div className='text-sm text-green-600 mt-1'>
                          Billed annually ({formatCurrency(price)})
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className='space-y-4 mb-8'>
                    {plan.features.map((feature, index) => (
                      <li key={index} className='flex items-start gap-3'>
                        <Check className='w-5 h-5 text-green-500 mt-0.5 flex-shrink-0' />
                        <span className='text-gray-700'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribeClick(planType)}
                    className={cn(
                      'w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md',
                      hasActiveSubscription &&
                        subscription.plan_type === planType
                        ? 'bg-green-600 text-white cursor-default'
                        : isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    )}
                    disabled={
                      hasActiveSubscription &&
                      subscription.plan_type === planType
                    }
                  >
                    {hasActiveSubscription &&
                    subscription.plan_type === planType
                      ? 'Current Plan'
                      : hasActiveSubscription
                        ? 'Switch to This Plan'
                        : user
                          ? 'Subscribe Now'
                          : 'Sign In to Subscribe'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Method Modal */}
        {subscribeModal.isOpen && subscribeModal.planType && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-2xl font-bold text-gray-900'>
                  Choose Payment Method
                </h3>
                <button
                  onClick={closeSubscribeModal}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              <div className='space-y-4'>
                {/* Stripe */}
                <button
                  onClick={() => handlePaymentMethodSelect('stripe')}
                  disabled={!!loading}
                  className='w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
                >
                  {loading === 'stripe' ? (
                    <div className='flex items-center justify-center'>
                      <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      <span className='ml-2'>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <CreditCard className='w-5 h-5' />
                      <span>Credit Card (Stripe)</span>
                    </>
                  )}
                </button>

                {/* PayPal */}
                <button
                  onClick={() => handlePaymentMethodSelect('paypal')}
                  disabled={!!loading}
                  className='w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2 bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500'
                >
                  {loading === 'paypal' ? (
                    <div className='flex items-center justify-center'>
                      <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      <span className='ml-2'>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <DollarSign className='w-5 h-5' />
                      <span>PayPal</span>
                    </>
                  )}
                </button>

                {/* Crypto */}
                <button
                  onClick={() => handlePaymentMethodSelect('crypto')}
                  disabled={!!loading}
                  className='w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2 bg-orange-500 text-white hover:bg-orange-600 border-orange-500'
                >
                  {loading === 'crypto' ? (
                    <div className='flex items-center justify-center'>
                      <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      <span className='ml-2'>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Bitcoin className='w-5 h-5' />
                      <span>Cryptocurrency</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
