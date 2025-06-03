'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function CryptoCheckoutPage() {
  const searchParams = useSearchParams()
  const amount = searchParams.get('amount')
  const licenseType = searchParams.get('licenseType')
  const imageId = searchParams.get('imageId')

  if (!amount || !licenseType || !imageId) {
    return <p>Missing payment details.</p>
  }

  const amountValue = (parseInt(amount) / 100).toFixed(2)

  const handleCryptoPayment = async () => {
    try {
      const response = await fetch('/api/crypto/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountValue,
          currency: 'USD', // Or the currency your crypto gateway expects
          description: `License (${licenseType}) for image ${imageId}`,
          metadata: { imageId, licenseType },
        }),
      })
      const data = await response.json()
      if (data.checkoutUrl) {
        // Redirect to Coinbase Commerce hosted checkout page or handle other gateway responses
        window.location.href = data.checkoutUrl
      } else if (data.error) {
        alert(`Crypto payment error: ${data.error}`)
      } else {
        alert('Could not initiate crypto payment. Please try again.')
      }
    } catch (error: any) {
      console.error('Crypto payment initiation error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Cryptocurrency Checkout</h1>
      <p>Image ID: {imageId}</p>
      <p>License: {licenseType}</p>
      <p>Amount: ${amountValue}</p>
      <p className='my-4'>
        You will be redirected to our cryptocurrency payment partner to complete
        your purchase.
      </p>
      <Button onClick={handleCryptoPayment}>Proceed to Crypto Payment</Button>
      <Button
        onClick={() => window.history.back()}
        variant='link'
        className='mt-4 ml-2'
      >
        Cancel
      </Button>
    </div>
  )
}

export default function CryptoCheckoutPageWrapper() {
  return (
    <Suspense fallback={<div>Loading payment details...</div>}>
      <CryptoCheckoutPage />
    </Suspense>
  )
}
