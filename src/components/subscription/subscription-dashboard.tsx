'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  Calendar,
  Download,
  Eye,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getUserDownloadStats } from '@/lib/subscription-access'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'

interface SubscriptionData {
  id: string
  status: 'active' | 'cancelled' | 'expired'
  plan_type: string
  billing_interval: 'monthly' | 'yearly'
  current_period_end: string
  price_monthly: number
  price_yearly: number
  features: string[]
}

interface UsageStats {
  thisMonth: number
  allTime: number
  lastDownload?: string
}

export function SubscriptionDashboard() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  )
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch subscription data
        const subResponse = await fetch('/api/subscription')
        if (subResponse.ok) {
          const subData = await subResponse.json()
          setSubscription(subData.subscription)
        }

        // Fetch usage stats
        const stats = await getUserDownloadStats(user.id)
        setUsageStats(stats)
      } catch (err) {
        console.error('Error fetching subscription data:', err)
        setError('Failed to load subscription information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='h-4 w-4' />
      case 'cancelled':
        return <AlertCircle className='h-4 w-4' />
      case 'expired':
        return <XCircle className='h-4 w-4' />
      default:
        return <AlertCircle className='h-4 w-4' />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getPlanLimits = (planType: string) => {
    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) return null

    // Extract download limits from features
    const downloadFeature = plan.features.find(f => f.includes('Download'))
    if (downloadFeature?.includes('Unlimited')) {
      return { downloads: null, label: 'Unlimited' }
    }

    const match = downloadFeature?.match(/(\d+)/)
    if (match) {
      return { downloads: parseInt(match[1]), label: `${match[1]} per month` }
    }

    return { downloads: 50, label: '50 per month' } // Default
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading subscription information...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className='border-red-200'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 text-red-600'>
            <AlertCircle className='h-5 w-5' />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>
            <p className='text-gray-600'>
              Please log in to view your subscription status.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5 text-gray-400' />
            No Active Subscription
          </CardTitle>
          <CardDescription>
            Subscribe to get unlimited access to our image gallery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href='/membership'>View Subscription Plans</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const planLimits = getPlanLimits(subscription.plan_type)
  const currentPrice =
    subscription.billing_interval === 'monthly'
      ? subscription.price_monthly
      : subscription.price_yearly

  return (
    <div className='space-y-6'>
      {/* Main Subscription Card */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Crown className='h-5 w-5 text-purple-600' />
                {SUBSCRIPTION_PLANS[
                  subscription.plan_type as keyof typeof SUBSCRIPTION_PLANS
                ]?.name || subscription.plan_type}
              </CardTitle>
              <CardDescription>
                {formatPrice(currentPrice)} / {subscription.billing_interval}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              <div className='flex items-center gap-1'>
                {getStatusIcon(subscription.status)}
                {subscription.status}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>
                  {subscription.status === 'cancelled' ? 'Expires' : 'Renews'}{' '}
                  on
                </p>
                <p className='text-sm text-gray-600'>
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>Billing</p>
                <p className='text-sm text-gray-600 capitalize'>
                  {subscription.billing_interval}
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className='text-sm font-medium mb-2'>Plan Features</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              {subscription.features.map((feature, index) => (
                <li key={index} className='flex items-center gap-2'>
                  <CheckCircle className='h-3 w-3 text-green-500' />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-blue-600' />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center gap-2'>
                <Download className='h-4 w-4 text-gray-500' />
                <div>
                  <p className='text-sm font-medium'>This Month</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {usageStats.thisMonth}
                  </p>
                  {planLimits && planLimits.downloads && (
                    <div className='mt-2'>
                      <div className='flex justify-between text-xs text-gray-600 mb-1'>
                        <span>Downloads used</span>
                        <span>
                          {usageStats.thisMonth} / {planLimits.downloads}
                        </span>
                      </div>
                      <Progress
                        value={
                          (usageStats.thisMonth / planLimits.downloads) * 100
                        }
                        className='h-2'
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Eye className='h-4 w-4 text-gray-500' />
                <div>
                  <p className='text-sm font-medium'>All Time</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {usageStats.allTime}
                  </p>
                  {usageStats.lastDownload && (
                    <p className='text-xs text-gray-500 mt-1'>
                      Last: {formatDate(usageStats.lastDownload)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex gap-4'>
            <Button variant='outline' asChild>
              <a href='/membership'>Change Plan</a>
            </Button>
            <Button variant='outline' asChild>
              <a href='/api/stripe/customer-portal'>Manage Billing</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
