'use client'

import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Image as ImageType } from '@/types/image'

interface LicenseSelectorProps {
  image: ImageType
  isOpen: boolean
  onClose: () => void
  onCheckout: (
    image: ImageType,
    licenseType: 'standard' | 'premium' | 'commercial'
  ) => void
}

const LICENSE_OPTIONS = [
  {
    type: 'standard' as const,
    name: 'Standard License',
    price: 5.0,
    description: 'Perfect for personal projects and small business use',
    features: [
      'High-resolution download',
      'Personal and commercial use',
      'Print up to 500,000 copies',
      'Digital usage unlimited',
    ],
  },
  {
    type: 'premium' as const,
    name: 'Premium License',
    price: 15.0,
    description: 'Ideal for larger commercial projects and marketing',
    features: [
      'Everything in Standard',
      'Extended commercial rights',
      'Print unlimited copies',
      'Resale rights included',
      'Priority support',
    ],
  },
  {
    type: 'commercial' as const,
    name: 'Commercial License',
    price: 30.0,
    description: 'Full commercial rights for any business use',
    features: [
      'Everything in Premium',
      'Full commercial rights',
      'Merchandise and product use',
      'Advertising and marketing',
      'No attribution required',
      'Exclusive usage options',
    ],
  },
]

export function LicenseSelector({
  image,
  isOpen,
  onClose,
  onCheckout,
}: LicenseSelectorProps) {
  const [selectedLicense, setSelectedLicense] = useState<
    'standard' | 'premium' | 'commercial'
  >('standard')

  const handleCheckout = () => {
    onCheckout(image, selectedLicense)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-4xl'>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>Choose License</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Image Preview */}
        <div className='mb-8'>
          <div className='flex items-center gap-4'>
            <img
              src={image.storage_url}
              alt={image.original_name}
              className='w-20 h-20 object-cover rounded-lg border'
            />
            <div>
              <h3 className='font-semibold text-lg text-gray-900'>
                {image.original_name}
              </h3>
              <p className='text-gray-600'>
                Select the license that best fits your needs
              </p>
            </div>
          </div>
        </div>

        {/* License Options */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          {LICENSE_OPTIONS.map(option => (
            <div
              key={option.type}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                selectedLicense === option.type
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedLicense(option.type)}
            >
              <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                  {option.name}
                </h3>
                <div className='text-3xl font-bold text-blue-600 mb-2'>
                  ${option.price.toFixed(2)}
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

              {selectedLicense === option.type && (
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
            Purchase{' '}
            {LICENSE_OPTIONS.find(o => o.type === selectedLicense)?.name} - $
            {LICENSE_OPTIONS.find(
              o => o.type === selectedLicense
            )?.price.toFixed(2)}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
