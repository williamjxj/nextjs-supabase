'use client'

import React from 'react'
import { CheckCircle, Settings, Calendar, Crown } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

interface SubscriptionHeaderProps {
  subscription: any
  formatCurrency: (amount: number) => string
  formatDate: (dateInput: string | number | Date | null | undefined) => string
}

export function SubscriptionHeader({
  subscription,
  formatCurrency,
  formatDate,
}: SubscriptionHeaderProps) {
  const { user } = useAuth()

  const currentPlan = subscription
    ? SUBSCRIPTION_PLANS[
        subscription.plan_type as keyof typeof SUBSCRIPTION_PLANS
      ]
    : null

  return (
    <div className='text-center mb-12'>
      <div className='max-w-3xl mx-auto'>
        <div className='flex items-center justify-center gap-3 mb-4'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
            <CheckCircle className='w-6 h-6 text-green-600' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900'>
            Your Current Plan
          </h1>
        </div>

        <div className='bg-white rounded-2xl shadow-lg border border-green-200 p-6 mb-6'>
          {/* Brief Plan Summary */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg'>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {currentPlan?.name ||
                    subscription.plan_type?.charAt(0).toUpperCase() +
                      subscription.plan_type?.slice(1) ||
                    'Standard'}{' '}
                  Plan
                </h2>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <span className='text-sm text-green-600 font-medium capitalize'>
                    {subscription.status} •{' '}
                    {subscription.billing_interval || 'monthly'} billing
                  </span>
                </div>
              </div>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold text-green-600'>
                {(() => {
                  const isYearly = subscription.billing_interval === 'yearly'
                  const planType = subscription.plan_type || 'standard'
                  const plan =
                    SUBSCRIPTION_PLANS[
                      planType as keyof typeof SUBSCRIPTION_PLANS
                    ]

                  // Try to get price from subscription data first, then from plan config
                  const price = isYearly
                    ? subscription.price_yearly || plan?.priceYearly || 99
                    : subscription.price_monthly || plan?.priceMonthly || 9.99

                  return formatCurrency(price)
                })()}
              </p>
              <p className='text-sm text-gray-600'>
                per{' '}
                {subscription.billing_interval === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
          </div>

          {/* Next Billing Info */}
          {(() => {
            const nextBillingDate = formatDate(subscription.current_period_end)
            if (nextBillingDate && nextBillingDate !== 'Not available') {
              return (
                <div className='bg-gray-50 rounded-lg p-3 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4 text-gray-600' />
                    <span className='text-sm text-gray-700'>
                      Next billing: {nextBillingDate}
                    </span>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row items-center gap-3'>
            <Link href='/subscription' className='w-full sm:w-auto'>
              <button className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'>
                <Settings className='w-4 h-4' />
                Manage Subscription
              </button>
            </Link>
            <Link href='/gallery' className='w-full sm:w-auto'>
              <button className='w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'>
                <Crown className='w-4 h-4' />
                Access Gallery
              </button>
            </Link>
          </div>
        </div>

        <p className='text-gray-600'>
          Want to change your plan? Browse the options below or manage your
          subscription.
        </p>
      </div>
    </div>
  )
}
