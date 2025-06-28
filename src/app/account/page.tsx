'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import {
  User,
  CreditCard,
  Calendar,
  Settings,
  Crown,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import PayPalSubscriptionHandler from '@/components/paypal/paypal-subscription-handler'
import StripeSubscriptionHandler from '@/components/stripe/stripe-subscription-handler'

export default function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
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
  }, [user, loading, router])

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
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Account Dashboard
          </h1>
          <p className='text-gray-600'>Manage your account and subscription</p>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Profile Card */}
            <Card className='p-6'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  <User className='w-6 h-6 text-blue-600' />
                </div>
                <div>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    Profile
                  </h2>
                  <p className='text-gray-600'>Your account information</p>
                </div>
              </div>
              <div className='space-y-3'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Email
                  </label>
                  <p className='text-gray-900'>{user.email}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Member Since
                  </label>
                  <p className='text-gray-900'>{formatDate(user.created_at)}</p>
                </div>
              </div>
              <div className='mt-4 pt-4 border-t'>
                <Link href='/account/profile'>
                  <Button variant='outline' className='w-full sm:w-auto'>
                    <Settings className='w-4 h-4 mr-2' />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Subscription Card */}
            <Card className='p-6'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                  {subscription ? (
                    <Crown className='w-6 h-6 text-purple-600' />
                  ) : (
                    <CreditCard className='w-6 h-6 text-purple-600' />
                  )}
                </div>
                <div>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    Subscription
                  </h2>
                  <p className='text-gray-600'>
                    {subscription
                      ? 'Your current plan'
                      : 'No active subscription'}
                  </p>
                </div>
              </div>

              {subscription ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-3'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <div>
                        <p className='font-medium text-green-900'>
                          {currentPlan?.name || subscription.plan_type} Plan
                        </p>
                        <p className='text-sm text-green-700 capitalize'>
                          Status: {subscription.status}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-green-900'>
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
                      <p className='text-sm text-green-700'>
                        /
                        {subscription.billing_interval === 'yearly'
                          ? 'year'
                          : 'month'}
                      </p>
                    </div>
                  </div>

                  <div className='grid sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>
                        Payment Method
                      </label>
                      <p className='text-gray-900 capitalize'>
                        {subscription.payment_provider || 'Stripe'}
                      </p>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>
                        Next Billing
                      </label>
                      <p className='text-gray-900'>
                        {subscription.current_period_end
                          ? formatDate(subscription.current_period_end)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className='pt-4 border-t'>
                    <Link href='/account/subscription'>
                      <Button className='w-full sm:w-auto'>
                        <CreditCard className='w-4 h-4 mr-2' />
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className='text-center py-6'>
                  <AlertTriangle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No Active Subscription
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Subscribe to get unlimited access to our premium gallery
                  </p>
                  <Link href='/membership'>
                    <Button>
                      <Crown className='w-4 h-4 mr-2' />
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Actions */}
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <Link href='/account/subscription' className='block'>
                  <div className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <CreditCard className='w-5 h-5 text-gray-600' />
                      <span className='text-gray-900'>Subscription</span>
                    </div>
                    <ArrowRight className='w-4 h-4 text-gray-400' />
                  </div>
                </Link>

                <Link href='/account/profile' className='block'>
                  <div className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <User className='w-5 h-5 text-gray-600' />
                      <span className='text-gray-900'>Profile</span>
                    </div>
                    <ArrowRight className='w-4 h-4 text-gray-400' />
                  </div>
                </Link>

                <Link href='/account/settings' className='block'>
                  <div className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <Settings className='w-5 h-5 text-gray-600' />
                      <span className='text-gray-900'>Settings</span>
                    </div>
                    <ArrowRight className='w-4 h-4 text-gray-400' />
                  </div>
                </Link>
              </div>
            </Card>

            {/* Support */}
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Need Help?
              </h3>
              <p className='text-gray-600 mb-4'>
                Contact our support team if you have any questions.
              </p>
              <Button variant='outline' className='w-full'>
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
