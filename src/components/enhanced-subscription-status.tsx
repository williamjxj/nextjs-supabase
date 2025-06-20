'use client'

import { useAuth } from '@/hooks/use-auth'
import {
  Crown,
  Calendar,
  Download,
  AlertCircle,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useEffect, useState } from 'react'
import {
  checkSubscriptionAccess,
  type SubscriptionAccess,
} from '@/lib/subscription-access'

export function EnhancedSubscriptionStatus() {
  const { user, loading: authLoading } = useAuth()
  const [accessInfo, setAccessInfo] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAccessInfo = async () => {
      try {
        const access = await checkSubscriptionAccess()
        setAccessInfo(access)
      } catch (error) {
        console.error('Error fetching subscription access:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchAccessInfo()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user?.id, authLoading, user]) // Include user to satisfy exhaustive-deps

  if (loading || authLoading) {
    return (
      <div className='krea-card p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/3 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='krea-card p-6 border-orange-200 bg-orange-50'>
        <div className='flex items-center gap-3'>
          <AlertCircle className='h-5 w-5 text-orange-600' />
          <div className='flex-1'>
            <h3 className='font-medium text-orange-900'>
              Sign in to access premium features
            </h3>
            <p className='text-sm text-orange-700 mt-1'>
              Create an account to purchase images or subscribe for unlimited
              access.
            </p>
          </div>
          <Link href='/login'>
            <Button className='krea-button-primary'>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!accessInfo?.hasActiveSubscription) {
    const hasPurchases = (accessInfo?.purchaseSummary?.totalPurchases || 0) > 0

    return (
      <div className='krea-card p-6 border-blue-200 bg-blue-50'>
        <div className='flex items-center gap-3'>
          <Crown className='h-5 w-5 text-blue-600' />
          <div className='flex-1'>
            <h3 className='font-medium text-blue-900'>
              {hasPurchases
                ? 'Upgrade to Unlimited Access'
                : 'Get Premium Access'}
            </h3>
            <p className='text-sm text-blue-700 mt-1'>
              {hasPurchases
                ? `You've purchased ${accessInfo?.purchaseSummary?.totalPurchases} images. Get unlimited access with a subscription.`
                : 'Get unlimited downloads and access to premium features with a subscription.'}
            </p>
            {hasPurchases && (
              <div className='text-xs text-blue-600 mt-2 flex items-center gap-1'>
                <TrendingUp className='h-3 w-3' />
                Total spent: $
                {((accessInfo?.purchaseSummary?.totalSpent || 0) / 100).toFixed(
                  2
                )}
              </div>
            )}
          </div>
          <Link href='/membership'>
            <Button className='krea-button-primary'>View Plans</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('krea-card p-6', 'border-green-200 bg-green-50')}>
      <div className='flex items-center gap-3'>
        <Crown className='h-5 w-5 text-green-600' />
        <div className='flex-1'>
          <h3 className='font-medium text-green-900'>
            {accessInfo.subscriptionType
              ? `${accessInfo.subscriptionType.charAt(0).toUpperCase() + accessInfo.subscriptionType.slice(1)} Plan`
              : 'Subscription'}{' '}
            (Active)
          </h3>

          <div className='text-sm mt-1 text-green-700 space-y-1'>
            {/* Download usage info */}
            {accessInfo.downloadsRemaining !== undefined ? (
              <div className='flex items-center gap-1'>
                <Download className='h-3 w-3' />
                <span>
                  {accessInfo.downloadsRemaining} downloads remaining this month
                </span>
              </div>
            ) : (
              <div className='flex items-center gap-1'>
                <Download className='h-3 w-3' />
                <span>Unlimited downloads</span>
              </div>
            )}

            {/* Expiration info */}
            {accessInfo.subscriptionExpiresAt && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <span>
                  Renews on{' '}
                  {new Date(
                    accessInfo.subscriptionExpiresAt
                  ).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Access level indicator */}
            <div className='flex items-center gap-1'>
              <CheckCircle className='h-3 w-3' />
              <span className='capitalize'>
                Full gallery access • All images available
              </span>
            </div>
          </div>
        </div>

        <Link href='/account'>
          <Button
            variant='outline'
            size='sm'
            className='border-green-300 text-green-700 hover:bg-green-100'
          >
            Manage
          </Button>
        </Link>
      </div>
    </div>
  )
}
