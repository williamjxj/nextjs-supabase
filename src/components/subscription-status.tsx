'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  current_period_end: number
  plan_name: string
  amount: number
  currency: string
  interval: string
  cancel_at_period_end: boolean
  features?: any
}

interface SubscriptionStatusProps {
  className?: string
}

export function SubscriptionStatus({ className }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Fetching subscription status...')

      const response = await fetch('/api/subscription')
      console.log('📡 API Response status:', response.status)

      if (response.status === 401) {
        // User is not authenticated
        console.log('🔐 User not authenticated')
        setSubscription(null)
        setError('Please log in to view your subscription status')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(
          `Failed to fetch subscription: ${errorData.error || response.statusText}`
        )
      }

      const data = await response.json()
      console.log('📊 Subscription data received:', data)
      setSubscription(data.subscription)
    } catch (err) {
      console.error('💥 Error fetching subscription:', err)
      setError('Failed to load subscription information')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'trialing':
        return 'secondary'
      case 'past_due':
        return 'destructive'
      case 'canceled':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-red-600 mb-4'>{error}</p>
            {error.includes('log in') ? (
              <div className='flex gap-2 justify-center'>
                <Button
                  onClick={() => (window.location.href = '/login')}
                  variant='default'
                  size='sm'
                >
                  Log In
                </Button>
                <Button onClick={fetchSubscription} variant='outline' size='sm'>
                  Retry
                </Button>
              </div>
            ) : (
              <Button onClick={fetchSubscription} variant='outline' size='sm'>
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don&apos;t have an active subscription. Choose a plan to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Browse Plans</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className='text-xl'>{subscription.plan_name}</CardTitle>
            <CardDescription>
              {formatPrice(subscription.amount, subscription.currency)} /{' '}
              {subscription.interval}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(subscription.status)}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <p className='text-sm text-gray-600'>Current Period</p>
          <p className='font-medium'>
            {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
            {formatDate(subscription.current_period_end)}
          </p>
        </div>

        {subscription.cancel_at_period_end && (
          <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
            <p className='text-sm text-yellow-800'>
              Your subscription is set to cancel at the end of the current
              period.
            </p>
          </div>
        )}

        <div className='flex gap-2 pt-4'>
          <Button variant='outline' size='sm'>
            Change Plan
          </Button>
          <Button variant='outline' size='sm'>
            {subscription.cancel_at_period_end ? 'Reactivate' : 'Cancel'}{' '}
            Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
