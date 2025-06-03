'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PaymentMethodSelectorProps {
  onPaymentSelect: (method: 'stripe' | 'paypal' | 'crypto') => void
  amount: number
  licenseType: string
  imageId: string
}

export function PaymentMethodSelector({
  onPaymentSelect,
  amount,
  licenseType,
  imageId,
}: PaymentMethodSelectorProps) {
  const router = useRouter()

  const handleSelect = (method: 'stripe' | 'paypal' | 'crypto') => {
    // For now, we'll navigate to placeholder pages or call the existing Stripe logic
    // In the future, this will call onPaymentSelect(method) which would then
    // initiate the respective payment flow.
    if (method === 'stripe') {
      // Assuming you have a function to initiate stripe checkout
      // This will be replaced by onPaymentSelect(method) later
      console.log('Stripe selected')
      // Call your existing Stripe checkout logic here or navigate
      // For example, if your stripe checkout is a POST request:
      fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          licenseType,
          imageId,
          returnUrl: window.location.href,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            router.push(data.url)
          } else {
            console.error('Stripe checkout failed:', data.error)
            // Handle error display to user
          }
        })
        .catch(error => {
          console.error('Stripe checkout error:', error)
          // Handle error display to user
        })
    } else if (method === 'paypal') {
      router.push(
        `/paypal/checkout?amount=${amount}&licenseType=${licenseType}&imageId=${imageId}`
      )
    } else if (method === 'crypto') {
      router.push(
        `/crypto/checkout?amount=${amount}&licenseType=${licenseType}&imageId=${imageId}`
      )
    }
  }

  return (
    <div className='space-y-4 p-4 border rounded-lg'>
      <h3 className='text-lg font-semibold'>Select Payment Method</h3>
      <p>
        Amount: ${(amount / 100).toFixed(2)} for {licenseType} license
      </p>
      <div className='flex flex-col space-y-2'>
        <Button onClick={() => handleSelect('stripe')} variant='outline'>
          Pay with Stripe
        </Button>
        <Button onClick={() => handleSelect('paypal')} variant='outline'>
          Pay with PayPal
        </Button>
        <Button onClick={() => handleSelect('crypto')} variant='outline'>
          Pay with Cryptocurrency
        </Button>
      </div>
    </div>
  )
}
