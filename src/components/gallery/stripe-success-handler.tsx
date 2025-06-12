'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export function StripeSuccessHandler() {
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')

    if (success === 'true' && sessionId && !isProcessing) {
      setIsProcessing(true)
      
      console.log('🎉 Stripe payment successful, processing session:', sessionId)
      
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
            console.log('✅ Purchase record created:', data.purchase)
          } else {
            console.error('❌ Failed to process purchase:', data.error)
            addToast({
              type: 'error',
              title: 'Processing Error',
              description: data.error || 'Failed to process your purchase. Please contact support.',
            })
          }
        })
        .catch(error => {
          console.error('❌ Error verifying session:', error)
          addToast({
            type: 'error',
            title: 'Verification Error',
            description: 'Failed to verify your payment. Please contact support.',
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
  }, [searchParams, addToast, isProcessing])

  return null // This component doesn't render anything
}
