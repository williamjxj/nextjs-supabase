'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useSubscription } from '@/hooks/use-subscription'
import { SubscriptionType } from '@/lib/stripe'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const {
    loading,
    subscription,
    plans,
    invoices,
    error,
    isActive,
    isGracePeriod,
    isExpired,
    cancelSubscription,
    changePlan,
  } = useSubscription()

  const [changingPlan, setChangingPlan] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false)
  const [selectedPlanType, setSelectedPlanType] =
    useState<SubscriptionType | null>(null)

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
      )
    ) {
      return
    }

    setCancelling(true)
    const { success, error } = await cancelSubscription()
    setCancelling(false)

    if (success) {
      showToast(
        'Your subscription has been cancelled and will end at the current billing period.',
        'success'
      )
    } else {
      showToast(`Failed to cancel subscription: ${error}`, 'error')
    }
  }

  const handleChangePlan = async () => {
    if (!selectedPlanType) return

    setChangingPlan(true)
    const { success, error, redirectUrl } = await changePlan(selectedPlanType)
    setChangingPlan(false)

    if (success && redirectUrl) {
      window.location.href = redirectUrl
    } else {
      showToast(`Failed to update subscription: ${error}`, 'error')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getCurrentPlanLabel = () => {
    if (!subscription) return 'No active subscription'
    if (isGracePeriod) return 'Cancelling soon'
    if (isActive) return 'Active'
    return (
      subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
    )
  }

  if (loading) {
    return (
      <div className='container max-w-4xl mx-auto py-12 px-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center justify-center py-12'>
          <div className='w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin'></div>
          <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
            Loading subscription details...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container max-w-4xl mx-auto py-12 px-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center justify-center py-12'>
          <AlertTriangle className='w-16 h-16 text-red-500 mb-4' />
          <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
            Error Loading Subscription
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300 mb-6'>
            {error}
          </p>
          <Button onClick={() => router.push('/membership')}>
            View Membership Options
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900 dark:text-white'>
        Manage Subscription
      </h1>

      {!subscription ? (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8'>
          <div className='flex flex-col items-center justify-center py-6'>
            <XCircle className='w-16 h-16 text-gray-400 mb-4' />
            <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-4'>
              No Active Subscription
            </h2>
            <p className='text-gray-600 dark:text-gray-300 mb-6 text-center'>
              You don&apos;t currently have an active subscription. Subscribe to get
              full access to our gallery.
            </p>
            <Button onClick={() => router.push('/membership')}>
              View Membership Options
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white'>
                Current Subscription
              </h2>
              <div className='flex items-center'>
                {isActive && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mr-2'>
                    <CheckCircle className='w-4 h-4 mr-1' />
                    Active
                  </span>
                )}
                {isGracePeriod && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mr-2'>
                    <AlertTriangle className='w-4 h-4 mr-1' />
                    Cancelling
                  </span>
                )}
                {!isActive && !isGracePeriod && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mr-2'>
                    <XCircle className='w-4 h-4 mr-1' />
                    {subscription.status}
                  </span>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-lg font-medium text-gray-800 dark:text-white'>
                      {subscription.subscription_plans?.name || 'Unknown Plan'}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      {subscription.subscription_plans?.description || ''}
                    </p>
                  </div>

                  <div className='flex items-center text-gray-600 dark:text-gray-300'>
                    <CreditCard className='w-5 h-5 mr-2' />
                    <span>
                      {formatCurrency(
                        subscription.subscription_plans?.price || 0,
                        subscription.subscription_plans?.currency || 'usd'
                      )}{' '}
                      / {subscription.subscription_plans?.interval || 'month'}
                    </span>
                  </div>

                  <div className='flex items-center text-gray-600 dark:text-gray-300'>
                    <Calendar className='w-5 h-5 mr-2' />
                    <span>
                      {isGracePeriod
                        ? `Cancels on ${formatDate(subscription.current_period_end)}`
                        : `Next billing date: ${formatDate(subscription.current_period_end)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col justify-end space-y-3'>
                {isActive && !showUpgradeOptions && (
                  <>
                    <Button
                      onClick={() => setShowUpgradeOptions(true)}
                      variant='outline'
                      className='w-full'
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Change Plan
                    </Button>
                    <Button
                      onClick={handleCancelSubscription}
                      variant='destructive'
                      className='w-full'
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                  </>
                )}

                {isGracePeriod && (
                  <div className='bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg'>
                    <p className='text-yellow-800 dark:text-yellow-200 text-sm'>
                      Your subscription will be canceled on{' '}
                      {formatDate(subscription.current_period_end)}. You can
                      reactivate it before this date.
                    </p>
                    <Button
                      onClick={() => router.push('/membership')}
                      variant='outline'
                      className='mt-3 w-full'
                    >
                      Reactivate Subscription
                    </Button>
                  </div>
                )}

                {isExpired && (
                  <Button
                    onClick={() => router.push('/membership')}
                    className='w-full'
                  >
                    Renew Subscription
                  </Button>
                )}
              </div>
            </div>

            {showUpgradeOptions && (
              <div className='mt-8 border-t pt-6'>
                <h3 className='text-lg font-medium text-gray-800 dark:text-white mb-4'>
                  Change Subscription Plan
                </h3>

                <div className='grid md:grid-cols-3 gap-4 mb-6'>
                  {plans.map(plan => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        selectedPlanType === plan.type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() =>
                        setSelectedPlanType(plan.type as SubscriptionType)
                      }
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <h4 className='font-medium text-gray-800 dark:text-white'>
                          {plan.name}
                        </h4>
                        {selectedPlanType === plan.type && (
                          <CheckCircle className='w-5 h-5 text-blue-500' />
                        )}
                      </div>
                      <p className='text-gray-600 dark:text-gray-300 text-sm mb-2'>
                        {formatCurrency(plan.price, plan.currency)} /{' '}
                        {plan.interval}
                      </p>
                      {subscription.subscription_plans?.type === plan.type && (
                        <span className='text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded'>
                          Current Plan
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className='flex space-x-3'>
                  <Button
                    onClick={handleChangePlan}
                    disabled={
                      changingPlan ||
                      !selectedPlanType ||
                      selectedPlanType === subscription.subscription_plans?.type
                    }
                  >
                    {changingPlan ? 'Processing...' : 'Confirm Change'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowUpgradeOptions(false)
                      setSelectedPlanType(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {invoices.length > 0 && (
            <Card className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-white mb-6'>
                Billing History
              </h2>

              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                  <thead>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Date
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Amount
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Period
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    {invoices.map(invoice => (
                      <tr key={invoice.id}>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300'>
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300'>
                          {formatCurrency(
                            invoice.amount_paid,
                            invoice.currency
                          )}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'open'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300'>
                          {invoice.invoice_period_start
                            ? `${formatDate(invoice.invoice_period_start)} - ${formatDate(invoice.invoice_period_end || '')}`
                            : 'N/A'}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm'>
                          {invoice.receipt_url ? (
                            <a
                              href={invoice.receipt_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-500 hover:text-blue-700'
                            >
                              View Receipt
                            </a>
                          ) : (
                            <span className='text-gray-400'>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
