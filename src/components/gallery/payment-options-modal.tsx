'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface PaymentOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPaymentMethod: (
    method: 'stripe' | 'paypal' | 'cryptocurrency'
  ) => void
  isAuthenticated?: boolean
}

export function PaymentOptionsModal({
  isOpen,
  onClose,
  onSelectPaymentMethod,
  isAuthenticated = false,
}: PaymentOptionsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-md'>
      <div className='p-6'>
        <h2 className='text-2xl font-bold mb-4'>Select Payment Method</h2>
        <div className='space-y-4'>
          <Button
            onClick={() => onSelectPaymentMethod('stripe')}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white'
          >
            Pay with Stripe {!isAuthenticated && '(Login Required)'}
          </Button>
          <Button
            onClick={() => onSelectPaymentMethod('paypal')}
            className='w-full bg-yellow-500 hover:bg-yellow-600 text-white'
          >
            Pay with PayPal {!isAuthenticated && '(Login Required)'}
          </Button>
          <Button
            onClick={() => onSelectPaymentMethod('cryptocurrency')}
            className='w-full bg-gray-800 hover:bg-gray-900 text-white'
          >
            Pay with Cryptocurrency {!isAuthenticated && '(Login Required)'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
