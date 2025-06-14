'use client'

import { useEffect } from 'react'

export default function TestPayPalReturn() {
  useEffect(() => {
    // Set up localStorage to simulate PayPal checkout
    console.log('🔧 Setting up PayPal localStorage data for testing...')

    localStorage.setItem('paypal_plan_type', 'premium')
    localStorage.setItem('paypal_billing_interval', 'monthly')
    localStorage.setItem(
      'paypal_user_id',
      '119eae9f-00a6-4d4e-a0da-da097d7876da'
    )

    console.log('✅ PayPal localStorage data set')

    // Redirect to account page with PayPal success params after a short delay
    setTimeout(() => {
      const params = new URLSearchParams({
        success: 'true',
        payment: 'paypal',
        subscription_id: 'I-REAL-TEST-SUBSCRIPTION-67890',
      })

      window.location.href = `/account?${params.toString()}`
    }, 1000)
  }, [])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md mx-auto text-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
        <h2 className='mt-6 text-2xl font-semibold text-gray-900'>
          Simulating PayPal Return...
        </h2>
        <p className='mt-2 text-gray-600'>
          Setting up localStorage and redirecting to account page
        </p>
      </div>
    </div>
  )
}
