'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  SUBSCRIPTION_PLANS,
  STRIPE_PRICE_IDS,
  SubscriptionPlanType,
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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'

// Payment method type
type PaymentMethod = 'stripe' | 'paypal' | 'crypto'

interface SubscribeModalState {
  isOpen: boolean
  planType: SubscriptionPlanType | null
}

export default function MembershipPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  )
  const [subscribeModal, setSubscribeModal] = useState<SubscribeModalState>({
    isOpen: false,
    planType: null,
  })
  const [loading, setLoading] = useState<PaymentMethod | null>(null)
  const router = useRouter()
  const { showToast } = useToast()
  const { user, syncAuthSession } = useAuth()

  // Debug: Log user state on component mount and when user changes
  useEffect(() => {
    console.log('🔍 MembershipPage user state:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      subscriptionTier: user?.subscriptionTier,
    })
  }, [user])

  // Development mode: Create mock user for testing when no auth
  const getEffectiveUser = () => {
    if (user) return user

    // In development, create a mock user for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Using mock user for testing')
      return {
        id: 'dev-test-user-123',
        email: 'test@example.com',
        subscriptionTier: null,
        hasActiveSubscription: false,
      }
    }

    return null
  }

  const handleSubscribeClick = (planType: SubscriptionPlanType) => {
    setSubscribeModal({ isOpen: true, planType })
  }

  const closeSubscribeModal = () => {
    setSubscribeModal({ isOpen: false, planType: null })
    setLoading(null)
  }

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (!subscribeModal.planType) return

    setLoading(method)
    try {
      // Get effective user (real user or mock for development)
      const effectiveUser = getEffectiveUser()

      // Check authentication first - enhanced check for session sync
      if (!effectiveUser) {
        showToast(
          'Please log in to continue with your subscription',
          'error',
          'Authentication Required'
        )
        router.push('/login')
        setLoading(null)
        return
      }

      // For Stripe, skip server session validation since we use fallback approach
      if (method !== 'stripe') {
        // For other payment methods, try server session validation first
        try {
          console.log('🔍 Validating server session for', method)
          const sessionCheck = await fetch('/api/auth/session-check', {
            method: 'GET',
            credentials: 'include',
          })

          if (!sessionCheck.ok) {
            console.warn('Server session validation failed, attempting sync...')
            const syncSuccess = await syncAuthSession()

            if (!syncSuccess) {
              showToast(
                'Unable to sync authentication session. Please try logging out and back in.',
                'error',
                'Session Sync Failed'
              )
              setLoading(null)
              return
            }

            // Wait for session to propagate
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Retry session check
            const retryCheck = await fetch('/api/auth/session-check', {
              method: 'GET',
              credentials: 'include',
            })

            if (!retryCheck.ok) {
              showToast(
                'Session validation failed after sync. Please log in again.',
                'error',
                'Session Expired'
              )
              router.push('/login')
              setLoading(null)
              return
            }
          }
        } catch (sessionError) {
          console.warn('Session check failed:', sessionError)
          showToast(
            'Unable to validate session. Please try refreshing the page.',
            'warning',
            'Session Validation Error'
          )
          setLoading(null)
          return
        }
      }

      // Debug: Send client session info to server for comparison
      try {
        await fetch('/api/debug/client-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            hasUser: !!effectiveUser,
            userId: effectiveUser?.id,
            userEmail: effectiveUser?.email,
          }),
        })
      } catch (debugError) {
        console.warn('Debug call failed:', debugError)
      }

      switch (method) {
        case 'stripe':
          // Get the correct price ID based on plan type and billing interval
          const priceId =
            STRIPE_PRICE_IDS[subscribeModal.planType][billingInterval]

          console.log('💳 Processing Stripe checkout with fallback approach...')

          // Since server session is unreliable, use fallback approach directly
          // when user is authenticated on client-side
          const stripeResponse = await fetch(
            '/api/stripe/checkout/subscription-fallback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                priceId,
                successUrl: `${window.location.origin}/account?success=true`,
                cancelUrl: `${window.location.origin}/membership`,
                userId: effectiveUser.id,
                userEmail: effectiveUser.email,
              }),
            }
          )

          if (!stripeResponse.ok) {
            const errorData = await stripeResponse.json()
            console.error('Stripe fallback failed:', errorData)

            if (stripeResponse.status === 401) {
              showToast(
                'Authentication session expired. Please log in again.',
                'error',
                'Session Expired'
              )
              router.push('/login')
              setLoading(null)
              return
            }

            throw new Error(
              `Stripe checkout failed: ${errorData.error || 'Unknown error'}`
            )
          }

          const stripeData = await stripeResponse.json()
          if (stripeData.sessionId) {
            // Redirect to Stripe checkout
            const stripe = (await import('@stripe/stripe-js')).loadStripe(
              process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
            )
            const stripeInstance = await stripe
            if (stripeInstance) {
              await stripeInstance.redirectToCheckout({
                sessionId: stripeData.sessionId,
              })
            }
          } else {
            throw new Error(
              stripeData.error || 'Failed to create checkout session'
            )
          }
          break

        case 'paypal':
          const paypalResponse = await fetch('/api/paypal/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              planType: subscribeModal.planType,
              billingInterval,
            }),
          })

          if (!paypalResponse.ok) {
            if (paypalResponse.status === 401) {
              // Enhanced error handling for PayPal
              try {
                const errorData = await paypalResponse.json()
                console.warn('PayPal API authentication failed:', errorData)

                if (user?.id) {
                  showToast(
                    'Session synchronization issue detected. Please refresh and try again.',
                    'error',
                    'Session Sync Error'
                  )
                  setTimeout(() => window.location.reload(), 2000)
                } else {
                  showToast(
                    'Please log in to continue with your subscription',
                    'error',
                    'Authentication Required'
                  )
                  router.push('/login')
                }
              } catch (jsonError) {
                if (user) {
                  showToast(
                    'Your session has expired. Please log in again.',
                    'error',
                    'Session Expired'
                  )
                } else {
                  showToast(
                    'Please log in to continue with your subscription',
                    'error',
                    'Authentication Required'
                  )
                }
                router.push('/login')
              }
              setLoading(null)
              return
            }
            const errorMessage = `HTTP ${paypalResponse.status}: ${paypalResponse.statusText}`
            throw new Error(errorMessage)
          }

          const paypalData = await paypalResponse.json()
          if (paypalData.approvalUrl) {
            window.location.href = paypalData.approvalUrl
          } else {
            throw new Error(
              paypalData.error || 'Failed to create PayPal checkout'
            )
          }
          break

        case 'crypto':
          const cryptoResponse = await fetch('/api/crypto/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              planType: subscribeModal.planType,
              billingInterval,
            }),
          })

          if (!cryptoResponse.ok) {
            if (cryptoResponse.status === 401) {
              // Enhanced error handling for Crypto
              try {
                const errorData = await cryptoResponse.json()
                console.warn('Crypto API authentication failed:', errorData)

                if (user?.id) {
                  showToast(
                    'Session synchronization issue detected. Please refresh and try again.',
                    'error',
                    'Session Sync Error'
                  )
                  setTimeout(() => window.location.reload(), 2000)
                } else {
                  showToast(
                    'Please log in to continue with your subscription',
                    'error',
                    'Authentication Required'
                  )
                  router.push('/login')
                }
              } catch (jsonError) {
                if (user) {
                  showToast(
                    'Your session has expired. Please log in again.',
                    'error',
                    'Session Expired'
                  )
                } else {
                  showToast(
                    'Please log in to continue with your subscription',
                    'error',
                    'Authentication Required'
                  )
                }
                router.push('/login')
              }
              setLoading(null)
              return
            }
            const errorMessage = `HTTP ${cryptoResponse.status}: ${cryptoResponse.statusText}`
            throw new Error(errorMessage)
          }

          const cryptoData = await cryptoResponse.json()
          if (cryptoData.hostedUrl) {
            window.location.href = cryptoData.hostedUrl
          } else {
            throw new Error(
              cryptoData.error || 'Failed to create cryptocurrency checkout'
            )
          }
          break
      }
    } catch (error) {
      // Don't log authentication errors since they're handled gracefully
      if (
        error instanceof Error &&
        error.message.includes('Authentication required')
      ) {
        return // Authentication errors are already handled above
      }

      console.error('Error creating checkout session:', error)
      showToast(
        error instanceof Error ? error.message : 'Checkout failed',
        'error',
        'Payment Error'
      )
    } finally {
      setLoading(null)
    }
  }

  // Calculate yearly discount
  const getYearlyDiscount = () => {
    const monthlyTotal = Object.values(SUBSCRIPTION_PLANS)[0].priceMonthly * 12
    const yearlyPrice = Object.values(SUBSCRIPTION_PLANS)[0].priceYearly
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100)
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    const discount = getYearlyDiscount() / 100
    return monthlyPrice * 12 * (1 - discount)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      <div className='container mx-auto px-4 py-12'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h1 className='text-5xl font-bold text-gray-900 mb-6'>
            Choose Your <span className='text-blue-600'>Membership</span>
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Get unlimited access to our premium gallery with subscription plans
            designed to fit your needs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className='flex items-center justify-center mb-12'>
          <div className='flex items-center gap-4 bg-white rounded-full p-2 shadow-sm border'>
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                'px-6 py-3 rounded-full font-medium transition-all duration-200',
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
                'px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2',
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Yearly
              <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                Save {getYearlyDiscount()}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className='max-w-6xl mx-auto'>
          <div className='grid gap-8 lg:grid-cols-3'>
            {Object.entries(SUBSCRIPTION_PLANS).map(
              ([planType, plan], index) => {
                const isPopular = planType === 'premium'
                const isPremium = planType === 'commercial'

                const monthlyPrice = plan.priceMonthly
                const yearlyPrice = getYearlyPrice(monthlyPrice)
                const displayPrice =
                  billingInterval === 'monthly' ? monthlyPrice : yearlyPrice
                const pricePerMonth =
                  billingInterval === 'monthly'
                    ? monthlyPrice
                    : yearlyPrice / 12

                return (
                  <div
                    key={planType}
                    className={cn(
                      'relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all duration-200 hover:shadow-xl',
                      isPopular
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : isPremium
                          ? 'border-purple-500 bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                          : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                        <div className='bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
                          <Star className='w-4 h-4' />
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Premium Badge */}
                    {isPremium && (
                      <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                        <div className='bg-white text-purple-700 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
                          <Crown className='w-4 h-4' />
                          Premium
                        </div>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className='text-center mb-8'>
                      <div className='flex items-center justify-center mb-4'>
                        {planType === 'standard' && (
                          <Zap
                            className={cn(
                              'w-8 h-8',
                              isPremium ? 'text-purple-200' : 'text-blue-500'
                            )}
                          />
                        )}
                        {planType === 'premium' && (
                          <Star
                            className={cn(
                              'w-8 h-8',
                              isPremium ? 'text-purple-200' : 'text-blue-500'
                            )}
                          />
                        )}
                        {planType === 'commercial' && (
                          <Crown
                            className={cn(
                              'w-8 h-8',
                              isPremium ? 'text-purple-200' : 'text-purple-500'
                            )}
                          />
                        )}
                      </div>
                      <h3
                        className={cn(
                          'text-2xl font-bold mb-2',
                          isPremium ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={cn(
                          'text-sm',
                          isPremium ? 'text-purple-100' : 'text-gray-600'
                        )}
                      >
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className='text-center mb-8'>
                      <div className='flex items-end justify-center gap-1 mb-2'>
                        <span
                          className={cn(
                            'text-4xl font-bold',
                            isPremium ? 'text-white' : 'text-gray-900'
                          )}
                        >
                          ${displayPrice.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            'text-base',
                            isPremium ? 'text-purple-100' : 'text-gray-600'
                          )}
                        >
                          /{billingInterval === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {billingInterval === 'yearly' && (
                        <p
                          className={cn(
                            'text-sm',
                            isPremium ? 'text-purple-200' : 'text-gray-500'
                          )}
                        >
                          ${pricePerMonth.toFixed(2)}/month billed annually
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className='space-y-4 mb-8'>
                      {plan.features.map(feature => (
                        <li key={feature} className='flex items-start gap-3'>
                          <Check
                            className={cn(
                              'w-5 h-5 flex-shrink-0 mt-0.5',
                              isPremium ? 'text-purple-200' : 'text-green-500'
                            )}
                          />
                          <span
                            className={cn(
                              'text-base',
                              isPremium ? 'text-purple-100' : 'text-gray-700'
                            )}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Subscribe Button */}
                    <button
                      onClick={() =>
                        handleSubscribeClick(planType as SubscriptionPlanType)
                      }
                      className={cn(
                        'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md',
                        isPremium
                          ? 'bg-white text-purple-700 hover:bg-gray-50 border border-purple-200'
                          : isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                      )}
                    >
                      Subscribe Now
                    </button>
                  </div>
                )
              }
            )}
          </div>
        </div>

        {/* Bottom Note */}
        <div className='text-center mt-12'>
          <p className='text-sm text-gray-500'>
            All plans include 7-day free trial • Cancel anytime • No setup fees
          </p>
        </div>
      </div>

      {/* Payment Method Selector Modal */}
      {subscribeModal.isOpen && subscribeModal.planType && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative'>
            {/* Close Button */}
            <button
              onClick={closeSubscribeModal}
              className='absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <X className='w-5 h-5 text-gray-500' />
            </button>

            {/* Header */}
            <div className='text-center mb-6'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                Choose Payment Method
              </h3>
              <p className='text-sm text-gray-600'>
                Select how you&apos;d like to pay for your subscription
              </p>
            </div>

            {/* Payment Options */}
            <div className='space-y-3'>
              {/* Stripe Payment */}
              <button
                onClick={() => handlePaymentMethodSelect('stripe')}
                disabled={!!loading}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
                  'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loading === 'stripe' ? (
                  <div className='flex items-center justify-center'>
                    <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                    <span className='ml-2'>Processing...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className='w-5 h-5' />
                    <span>Credit/Debit Card</span>
                    <span className='text-xs bg-blue-500 px-2 py-1 rounded-full'>
                      Recommended
                    </span>
                  </>
                )}
              </button>

              {/* PayPal Payment */}
              <button
                onClick={() => handlePaymentMethodSelect('paypal')}
                disabled={!!loading}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
                  'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
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

              {/* Crypto Payment */}
              <button
                onClick={() => handlePaymentMethodSelect('crypto')}
                disabled={!!loading}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
                  'bg-orange-500 text-white hover:bg-orange-600 border-orange-500',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
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

            {/* Security Note */}
            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <p className='text-xs text-gray-600 text-center'>
                🔒 All payments are secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
