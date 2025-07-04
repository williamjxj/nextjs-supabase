'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function PayPalCheckoutPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const amount = searchParams.get('amount')
  const licenseType = searchParams.get('licenseType')
  const imageId = searchParams.get('imageId')

  if (!amount || !licenseType || !imageId) {
    return <p>Missing payment details.</p>
  }

  const amountValue = (parseInt(amount) / 100).toFixed(2)

  const createOrder = () => {
    return fetch('/api/paypal/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountValue, // PayPal expects amount as string
        licenseType,
        imageId,
        currencyCode: 'USD', // Or your desired currency
        userId: user?.id, // Pass user ID for fallback authentication
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || 'Failed to create PayPal order')
          })
        }
        return response.json()
      })
      .then(order => {
        if (order.id) {
          return order.id
        } else {
          throw new Error(order.error || 'Failed to get order ID from PayPal')
        }
      })
      .catch(err => {
        const redirectUrl =
          err.redirectUrl ||
          `/gallery?paypal_error=${encodeURIComponent(err.message)}`

        alert(`Error creating PayPal order: ${err.message}`)
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 2000)

        throw err
      })
  }

  const onApprove = (data: any) => {
    return fetch(`/api/paypal/capture`, {
      // Assuming a capture endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID: data.orderID,
        userId: user?.id, // Pass user ID for fallback authentication
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || 'Failed to capture PayPal payment')
          })
        }
        return response.json()
      })
      .then(details => {
        // Extract the capture ID for the purchase lookup
        const captureId =
          details.purchase_units?.[0]?.payments?.captures?.[0]?.id
        const finalPaymentId = captureId || details.id || data.orderID

        // Redirect to a success page with the PayPal payment details
        window.location.href = `/purchase/success?paymentId=${finalPaymentId}&method=paypal&imageId=${imageId}&licenseType=${licenseType}`
      })
      .catch(err => {
        console.error('PayPal onApprove error:', err)
        alert(`Error capturing PayPal payment: ${err.message}`)
        // Potentially redirect to a failure page or show error message
      })
  }

  const onError = (err: any) => {
    console.error('PayPal Button Error:', err)
    alert(
      `PayPal Error: ${err.message || 'An unknown error occurred.'} \nPlease try again or use a different payment method.`
    )
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>PayPal Checkout</h1>
      <p>Image ID: {imageId}</p>
      <p>License: {licenseType}</p>
      <p>Amount: ${amountValue}</p>

      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
          currency: 'USD',
        }}
      >
        <PayPalButtons
          style={{ layout: 'vertical' }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          disabled={!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}
        />
      </PayPalScriptProvider>
      {!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <p className='text-red-500'>
          PayPal Client ID not configured. Payment disabled.
        </p>
      )}
      <Button
        onClick={() => window.history.back()}
        variant='link'
        className='mt-4'
      >
        Cancel
      </Button>
    </div>
  )
}

export default function PayPalCheckoutPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center p-4'>
          <LoadingSpinner
            size='lg'
            variant='gradient'
            text='Loading payment details...'
          />
        </div>
      }
    >
      <PayPalCheckoutPage />
    </Suspense>
  )
}
