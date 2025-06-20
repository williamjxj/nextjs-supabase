'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export default function PayPalSubscriptionHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handlePayPalSuccess = async () => {
      // Check if this is a PayPal subscription success
      const payment = searchParams.get('payment')
      const subscriptionId = searchParams.get('subscription_id')
      const success = searchParams.get('success')

      if (!payment || payment !== 'paypal' || !subscriptionId || !success) {
        return
      }

      if (isProcessing) return
      setIsProcessing(true)

      try {
        console.log('🔄 Processing PayPal subscription activation...', {
          subscriptionId,
          payment,
        })

        // Extract plan details from URL params or localStorage
        const planType = localStorage.getItem('paypal_plan_type') || 'premium'
        const billingInterval =
          localStorage.getItem('paypal_billing_interval') || 'monthly'
        const userId = localStorage.getItem('paypal_user_id')

        if (!userId) {
          throw new Error('User ID not found. Please try logging in again.')
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

        // Redirect to clean account page after a short delay
        setTimeout(() => {
          router.push('/account')
        }, 2000)
      } catch (error) {
        console.error('❌ PayPal subscription activation error:', error)
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
