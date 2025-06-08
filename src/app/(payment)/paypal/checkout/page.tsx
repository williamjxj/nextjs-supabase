'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

function PayPalCheckoutPage() {
  const searchParams = useSearchParams()
  const amount = searchParams.get('amount')
  const licenseType = searchParams.get('licenseType')
  const imageId = searchParams.get('imageId')

  if (!amount || !licenseType || !imageId) {
    return <p>Missing payment details.</p>
  }

  const amountValue = (parseInt(amount) / 100).toFixed(2)

  const createOrder = (data: any, actions: any) => {
    console.log('Creating PayPal order for amount:', amountValue)
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
        console.error('PayPal createOrder error:', err)
        alert(`Error creating PayPal order: ${err.message}`)
        throw err // Re-throw to be caught by PayPalButtons
      })
  }

  const onApprove = (data: any, actions: any) => {
    console.log('PayPal order approved:', data.orderID)
    return fetch(`/api/paypal/capture`, {
      // Assuming a capture endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID: data.orderID,
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
        console.log('Payment captured:', details)
        // alert(
        //   `Transaction completed by ${details.payer?.name?.given_name || 'customer'}!`
        // )
        // Redirect to a success page, e.g., /purchase/success
        // router.push('/purchase/success?paymentId=${details.id}&method=paypal');
        window.location.href = `/purchase/success?paymentId=${details.id}&method=paypal&imageId=${imageId}&licenseType=${licenseType}`
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
    <Suspense fallback={<div>Loading payment details...</div>}>
      <PayPalCheckoutPage />
    </Suspense>
  )
}
