'use client'

import { useState } from 'react'
import { SubscriptionSelector } from '@/components/membership/subscription-selector'
import { useToast } from '@/components/ui/toast'

export default function SubscriptionPage() {
  const [isSubscriptionSelectorOpen, setIsSubscriptionSelectorOpen] =
    useState(true)
  const { showToast } = useToast()

  const handleSubscriptionCheckout = async (
    subscriptionType: 'standard' | 'premium' | 'commercial'
  ) => {
    try {
      showToast('Processing subscription... (redirecting to checkout)', 'info')
      // This would be your actual subscription checkout logic
      const response = await fetch('/api/stripe/checkout', {
        // Or a new /api/subscription/checkout
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionType, // This represents a subscription tier
          isSubscription: true, // Flag to differentiate from single image purchases
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error initiating subscription checkout:', error)
      showToast(
        `Failed to start subscription: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'error'
      )
    } finally {
      setIsSubscriptionSelectorOpen(false)
    }
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-6 text-gray-800'>
        Subscription Plans
      </h1>
      <p className='mb-8 text-gray-600'>
        Subscribe once and get unlimited access to download all thumbnails
        within your subscription tier. No need to pay per image!
      </p>

      <SubscriptionSelector
        isOpen={isSubscriptionSelectorOpen}
        onClose={() => {
          setIsSubscriptionSelectorOpen(false)
        }}
        onCheckout={handleSubscriptionCheckout}
      />

      {!isSubscriptionSelectorOpen && (
        <div className='text-center mt-8'>
          <button
            onClick={() => setIsSubscriptionSelectorOpen(true)}
            className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors'
          >
            View Subscription Plans
          </button>
        </div>
      )}
    </div>
  )
}
