'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PayPalTestPage() {
  const router = useRouter()
  const [testData, setTestData] = useState({
    subscriptionId: 'I-HKPKH7KM151W',
    userId: 'ed980dac-f57d-48d8-a566-bf386cf15389',
    planType: 'premium',
    billingInterval: 'monthly',
  })

  const simulatePayPalSuccess = () => {
    // Set localStorage as the membership page would
    localStorage.setItem('paypal_plan_type', testData.planType)
    localStorage.setItem('paypal_billing_interval', testData.billingInterval)
    localStorage.setItem('paypal_user_id', testData.userId)

    // Redirect to account page with PayPal success parameters
    const successUrl = `/account?success=true&payment=paypal&subscription_id=${testData.subscriptionId}&ba_token=BA-TEST123&token=TEST123`

    console.log('🔄 Simulating PayPal success redirect to:', successUrl)
    router.push(successUrl)
  }

  const testApiDirectly = async () => {
    console.log('🧪 Testing API directly...')

    try {
      const response = await fetch('/api/paypal/activate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const result = await response.json()
      console.log('✅ API test result:', result)
      alert(
        `API test ${response.ok ? 'SUCCESS' : 'FAILED'}: ${JSON.stringify(result, null, 2)}`
      )
    } catch (error) {
      console.error('❌ API test error:', error)
      alert(`API test FAILED: ${error}`)
    }
  }

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>PayPal Subscription Test</h1>

      <div className='space-y-4 mb-6'>
        <div>
          <label className='block font-medium'>Subscription ID:</label>
          <input
            type='text'
            value={testData.subscriptionId}
            onChange={e =>
              setTestData({ ...testData, subscriptionId: e.target.value })
            }
            className='w-full p-2 border rounded'
          />
        </div>

        <div>
          <label className='block font-medium'>User ID:</label>
          <input
            type='text'
            value={testData.userId}
            onChange={e => setTestData({ ...testData, userId: e.target.value })}
            className='w-full p-2 border rounded'
          />
        </div>

        <div>
          <label className='block font-medium'>Plan Type:</label>
          <select
            value={testData.planType}
            onChange={e =>
              setTestData({ ...testData, planType: e.target.value })
            }
            className='w-full p-2 border rounded'
          >
            <option value='standard'>Standard</option>
            <option value='premium'>Premium</option>
            <option value='commercial'>Commercial</option>
          </select>
        </div>

        <div>
          <label className='block font-medium'>Billing Interval:</label>
          <select
            value={testData.billingInterval}
            onChange={e =>
              setTestData({ ...testData, billingInterval: e.target.value })
            }
            className='w-full p-2 border rounded'
          >
            <option value='monthly'>Monthly</option>
            <option value='yearly'>Yearly</option>
          </select>
        </div>
      </div>

      <div className='space-x-4'>
        <button
          onClick={simulatePayPalSuccess}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
        >
          🔄 Simulate PayPal Success Flow
        </button>

        <button
          onClick={testApiDirectly}
          className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
        >
          🧪 Test API Directly
        </button>
      </div>

      <div className='mt-6 p-4 bg-gray-100 rounded'>
        <h3 className='font-medium mb-2'>Instructions:</h3>
        <ol className='list-decimal list-inside space-y-1 text-sm'>
          <li>Click "Test API Directly" to verify the API endpoint works</li>
          <li>
            Click "Simulate PayPal Success Flow" to test the web UI handler
          </li>
          <li>Check browser console for debug logs</li>
          <li>
            Check database with: <code>node test-subscriptions.js</code>
          </li>
        </ol>
      </div>
    </div>
  )
}
