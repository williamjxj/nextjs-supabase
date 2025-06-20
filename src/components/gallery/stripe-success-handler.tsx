'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface StripeSuccessHandlerProps {
  onPurchaseSuccess?: () => void
}

export function StripeSuccessHandler({
  onPurchaseSuccess,
}: StripeSuccessHandlerProps) {
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')

    if (success === 'true' && sessionId && !isProcessing) {
      setIsProcessing(true)

      // Call our verification endpoint to create the purchase record
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            addToast({
              type: 'success',
              title: 'Payment Successful!',
              description: 'Your purchase has been processed successfully.',
            })

            // Trigger gallery refresh to show updated purchase status
            if (onPurchaseSuccess) {
              // Small delay to ensure purchase record is properly indexed
              setTimeout(() => {
                onPurchaseSuccess()
              }, 1000) // Increased delay to ensure database is updated
            }
          } else {
            addToast({
              type: 'error',
              title: 'Processing Error',
              description:
                data.error ||
                'Failed to process your purchase. Please contact support.',
            })
          }
        })
        .catch(() => {
          addToast({
            type: 'error',
            title: 'Verification Error',
            description:
              'Failed to verify your payment. Please contact support.',
          })
        })
        .finally(() => {
          // Clean up URL parameters
          const url = new URL(window.location.href)
          url.searchParams.delete('success')
          url.searchParams.delete('session_id')
          window.history.replaceState({}, '', url.toString())
          setIsProcessing(false)
        })
    }

    // Handle cancellation
    const canceled = searchParams.get('canceled')
    if (canceled === 'true') {
      addToast({
        type: 'info',
        title: 'Payment Canceled',
        description: 'Your payment was canceled. You can try again anytime.',
      })

      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('canceled')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, addToast, isProcessing, onPurchaseSuccess])

  return null // This component doesn't render anything
}
