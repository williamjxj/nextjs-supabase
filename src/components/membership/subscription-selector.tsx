'use client'

import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Image as ImageType } from '@/types/image'

interface SubscriptionSelectorProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: (subscriptionType: 'standard' | 'premium' | 'commercial') => void
}

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

export function SubscriptionSelector({
  isOpen,
  onClose,
  onCheckout,
}: SubscriptionSelectorProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<
    'standard' | 'premium' | 'commercial'
  >('standard')

  const handleCheckout = () => {
    onCheckout(selectedSubscription)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-4xl'>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>
            Choose Your Subscription Plan
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        <div className='mb-6'>
          <p className='text-gray-600'>
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
        <div className='flex justify-end space-x-4'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            <ShoppingCart className='w-4 h-4 mr-2' />
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
    </Modal>
  )
}
