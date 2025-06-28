'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export default function StripeSubscriptionHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleStripeSuccess = async () => {
      // Check if this is a Stripe subscription success
      const success = searchParams.get('success')
      const sessionId = searchParams.get('session_id')

      // Skip if not a Stripe success or if it's a PayPal success
      if (
        !success ||
        success !== 'true' ||
        searchParams.get('payment') === 'paypal'
      ) {
        return
      }

      if (isProcessing) return
      setIsProcessing(true)

      try {
        showToast(
          'Verifying your Stripe subscription...',
          'info',
          'Processing Payment'
        )

        // For Stripe, manually activate subscription since webhooks might not work in development
        if (sessionId) {
          const response = await fetch('/api/stripe/activate-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          })

          if (response.ok) {
            const data = await response.json()

            showToast(
              'Your Stripe subscription has been activated successfully!',
              'success',
              'Subscription Active'
            )
          } else {
            const errorData = await response.json()
            showToast(
              'Payment processed, but activation failed. Please contact support.',
              'warning',
              'Activation Issue'
            )
          }
        } else {
          showToast(
            'Payment successful! Your subscription should be active shortly.',
            'success',
            'Payment Received'
          )
        }

        // Redirect to clean account page after a short delay
        setTimeout(() => {
          router.push('/account')
        }, 2000)
      } catch (error) {
        showToast(
          'Payment received, but verification failed. Please refresh the page.',
          'warning',
          'Verification Issue'
        )
      } finally {
        setIsProcessing(false)
      }
    }

    handleStripeSuccess()
  }, [searchParams, router, showToast, isProcessing])

  // Don't render anything, this is just a handler
  return null
}
