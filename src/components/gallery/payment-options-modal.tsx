import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Image as ImageType } from '@/types/image'

interface PaymentOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPaymentMethod: (method: 'stripe' | 'paypal' | 'cybercurrency') => void
  image: ImageType // Added to pass the image being checked out
}

export function PaymentOptionsModal({
  isOpen,
  onClose,
  onSelectPaymentMethod,
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
            Pay with Stripe
          </Button>
          <Button
            onClick={() => onSelectPaymentMethod('paypal')}
            className='w-full bg-yellow-500 hover:bg-yellow-600 text-white'
          >
            Pay with PayPal
          </Button>
          <Button
            onClick={() => onSelectPaymentMethod('cybercurrency')}
            className='w-full bg-gray-800 hover:bg-gray-900 text-white'
          >
            Pay with CyberCurrency
          </Button>
        </div>
      </div>
    </Modal>
  )
}
