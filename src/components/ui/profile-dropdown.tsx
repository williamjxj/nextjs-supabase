'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import { logoutAndRedirect } from '@/lib/auth/logout'
import {
  User,
  Crown,
  Settings,
  LogOut,
  ChevronDown,
  Calendar,
  Mail,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

export function ProfileDropdown() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSubscription()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
          'text-gray-700 dark:text-gray-300'
        )}
        aria-label='Profile menu'
      >
        <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
          <User className='w-4 h-4 text-blue-600 dark:text-blue-400' />
        </div>
        <span className='text-sm font-medium hidden sm:block max-w-24 truncate'>
          {user.email?.split('@')[0]}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 transition-transform hidden sm:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-10'
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className='absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20'>
            {/* User Info Header */}
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
                  <User className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                    <Mail className='w-3 h-3' />
                    <span className='truncate'>{user.email}</span>
                  </div>
                  <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    <Calendar className='w-3 h-3' />
                    <span>Member since {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                Subscription
              </h3>

              {loadingSubscription ? (
                <div className='animate-pulse'>
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                </div>
              ) : subscription ? (
                <div className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
                  <div className='flex items-center gap-2'>
                    <Crown className='w-4 h-4 text-green-600 dark:text-green-400' />
                    <div>
                      <p className='text-sm font-medium text-green-900 dark:text-green-100'>
                        {currentPlan?.name || subscription.plan_type}
                      </p>
                      <p className='text-xs text-green-700 dark:text-green-300 capitalize'>
                        {subscription.status} • {subscription.billing_interval}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-semibold text-green-900 dark:text-green-100'>
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
                    <p className='text-xs text-green-700 dark:text-green-300'>
                      /
                      {subscription.billing_interval === 'yearly'
                        ? 'year'
                        : 'month'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700'>
                  <AlertTriangle className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      No active subscription
                    </p>
                    <Link
                      href='/membership'
                      className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
                      onClick={() => setIsOpen(false)}
                    >
                      View plans →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className='py-2'>
              <Link
                href='/account'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              >
                <User className='w-4 h-4' />
                Account Dashboard
              </Link>

              <Link
                href='/account/subscription'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              >
                <CreditCard className='w-4 h-4' />
                Manage Subscription
              </Link>

              <Link
                href='/account/settings'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              >
                <Settings className='w-4 h-4' />
                Settings
              </Link>

              <div className='border-t border-gray-200 dark:border-gray-700 mt-2 pt-2'>
                <button
                  onClick={async () => {
                    setIsOpen(false)
                    console.log('🔍 Profile dropdown logout initiated')
                    await logoutAndRedirect()
                  }}
                  className='flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full'
                >
                  <LogOut className='w-4 h-4' />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
