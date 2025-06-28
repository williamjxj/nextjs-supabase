'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'

export default function PayPalSubscriptionHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handlePayPalSuccess = async () => {
      // Check if this is a PayPal subscription success
      const payment = searchParams.get('payment')
      const subscriptionId = searchParams.get('subscription_id')
      const success = searchParams.get('success')
      const isMock = searchParams.get('mock')

      if (!payment || payment !== 'paypal' || !success) {
        return
      }

      // For mock subscriptions, we need to handle them differently
      if (isMock === 'true') {
        if (!subscriptionId) {
          return
        }

        // For mock subscriptions, we'll create a test subscription
        showToast(
          'Mock PayPal subscription activated for development!',
          'success',
          'Development Mode'
        )

        // Clean up any localStorage
        localStorage.removeItem('paypal_plan_type')
        localStorage.removeItem('paypal_billing_interval')
        localStorage.removeItem('paypal_user_id')

        // Redirect to subscription page after a short delay
        setTimeout(() => {
          router.push('/account/subscription')
        }, 2000)

        return
      }

      // For real PayPal subscriptions, we need the subscription_id
      if (!subscriptionId) {
        return
      }

      if (isProcessing) return
      setIsProcessing(true)

      try {
        // Extract plan details from URL params or localStorage
        const planType = localStorage.getItem('paypal_plan_type') || 'premium'
        const billingInterval =
          localStorage.getItem('paypal_billing_interval') || 'monthly'
        const storedUserId = localStorage.getItem('paypal_user_id')

        // Use stored user ID or fall back to current user
        const userId = storedUserId || user?.id

        if (!userId) {
          showToast(
            'User session not found. Please sign in and try again.',
            'error',
            'Authentication Required'
          )
          // Redirect to login instead of throwing error
          setTimeout(() => {
            router.push('/login?redirect=/membership')
          }, 2000)
          return
        }

        showToast(
          'Activating your PayPal subscription...',
          'info',
          'Processing Payment'
        )

        const response = await fetch('/api/paypal/activate-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId,
            userId,
            planType,
            billingInterval,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to activate subscription')
        }

        showToast(
          'Your PayPal subscription has been activated successfully!',
          'success',
          'Subscription Active'
        )

        // Clean up localStorage
        localStorage.removeItem('paypal_plan_type')
        localStorage.removeItem('paypal_billing_interval')
        localStorage.removeItem('paypal_user_id')

        // Redirect to subscription page after a short delay
        setTimeout(() => {
          router.push('/account/subscription')
        }, 2000)
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to activate subscription',
          'error',
          'Activation Failed'
        )
      } finally {
        setIsProcessing(false)
      }
    }

    handlePayPalSuccess()
  }, [searchParams, router, showToast, isProcessing])

  // Don't render anything, this is just a handler
  return null
}
