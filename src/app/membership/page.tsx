'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

const SUBSCRIPTION_OPTIONS = [
  {
    type: 'standard' as const,
    name: 'Standard Plan',
    price: 9.99,
    period: 'month',
    description: 'Perfect for personal projects and small business use',
    features: [
      'Unlimited thumbnail downloads',
      'Access to standard collection',
      'Personal and commercial use',
      'Digital usage unlimited',
      'Monthly renewal',
    ],
  },
  {
    type: 'premium' as const,
    name: 'Premium Plan',
    price: 19.99,
    period: 'month',
    description: 'Ideal for larger commercial projects and marketing',
    features: [
      'Everything in Standard Plan',
      'Unlimited high-resolution downloads',
      'Access to premium collection',
      'Extended commercial rights',
      'Priority support',
      'Monthly renewal',
    ],
  },
  {
    type: 'commercial' as const,
    name: 'Commercial Plan',
    price: 39.99,
    period: 'month',
    description: 'Full commercial rights for any business use',
    features: [
      'Everything in Premium Plan',
      'Access to entire collection',
      'Full commercial rights',
      'Merchandise and product use',
      'Advertising and marketing',
      'No attribution required',
      'Monthly renewal',
    ],
  },
]

export default function MembershipPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<
    'standard' | 'premium' | 'commercial'
  >('standard')
  const { showToast } = useToast()

  const handleSubscriptionCheckout = async (
    subscriptionType: 'standard' | 'premium' | 'commercial'
  ) => {
    try {
      showToast('Processing subscription... (redirecting to checkout)', 'info')
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionType,
          isSubscription: true,
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
    }
  }

  const handleCheckout = () => {
    handleSubscriptionCheckout(selectedSubscription)
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Membership Plans</h1>
        <p className='text-muted-foreground'>
          Subscribe once and get unlimited access to download all thumbnails
          within your subscription tier. No need to pay per image!
        </p>
      </div>

      {/* Subscription Options */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {SUBSCRIPTION_OPTIONS.map(option => (
          <div
            key={option.type}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedSubscription === option.type
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSubscription(option.type)}
          >
            <div className='text-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                {option.name}
              </h3>
              <div className='text-3xl font-bold text-blue-600 mb-2'>
                ${option.price.toFixed(2)}/{option.period}
              </div>
              <p className='text-sm text-gray-600'>{option.description}</p>
            </div>

            <ul className='space-y-2'>
              {option.features.map((feature, index) => (
                <li
                  key={index}
                  className='flex items-center text-sm text-gray-700'
                >
                  <svg
                    className='w-4 h-4 text-green-500 mr-2 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {selectedSubscription === option.type && (
              <div className='mt-4 pt-4 border-t border-blue-200'>
                <div className='text-center'>
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                    Selected
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checkout Button */}
      <div className='text-center'>
        <Button
          onClick={handleCheckout}
          className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg'
        >
          <ShoppingCart className='w-5 h-5 mr-2' />
          Subscribe to{' '}
          {
            SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
              ?.name
          }{' '}
          - $
          {SUBSCRIPTION_OPTIONS.find(
            o => o.type === selectedSubscription
          )?.price.toFixed(2)}
          /
          {
            SUBSCRIPTION_OPTIONS.find(o => o.type === selectedSubscription)
              ?.period
          }
        </Button>
      </div>
    </div>
  )
}
