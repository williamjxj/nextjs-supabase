'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CreditCard, DollarSign, Bitcoin, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PaymentTestPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('10.00')
  const [licenseType, setLicenseType] = useState('standard')
  const [imageId, setImageId] = useState('test-image-123.jpg')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{
    method: string
    status: 'success' | 'error' | 'pending'
    message: string
    time: string
  } | null>(null)

  const licenseOptions = [
    { value: 'standard', label: 'Standard License', price: 10.0 },
    { value: 'extended', label: 'Extended License', price: 25.0 },
    { value: 'commercial', label: 'Commercial License', price: 50.0 },
    { value: 'exclusive', label: 'Exclusive License', price: 100.0 },
  ]

  const handleStripePayment = async () => {
    setIsLoading('stripe')
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          licenseType,
          imageId,
          returnUrl: window.location.href,
        }),
      })

      const data = await response.json()

      if (data.url) {
        setLastResult({
          method: 'Stripe',
          status: 'pending',
          message: 'Redirecting to Stripe checkout...',
          time: new Date().toLocaleTimeString(),
        })
        window.location.href = data.url
      } else {
        throw new Error(
          data.error || 'Failed to create Stripe checkout session'
        )
      }
    } catch (error: any) {
      setLastResult({
        method: 'Stripe',
        status: 'error',
        message: error.message,
        time: new Date().toLocaleTimeString(),
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handlePayPalPayment = () => {
    setIsLoading('paypal')
    setLastResult({
      method: 'PayPal',
      status: 'pending',
      message: 'Redirecting to PayPal checkout...',
      time: new Date().toLocaleTimeString(),
    })

    const amountInCents = Math.round(parseFloat(amount) * 100)
    router.push(
      `/paypal/checkout?amount=${amountInCents}&licenseType=${licenseType}&imageId=${imageId}`
    )
  }

  const handleCryptoPayment = () => {
    setIsLoading('crypto')
    setLastResult({
      method: 'Cryptocurrency',
      status: 'pending',
      message: 'Redirecting to crypto checkout...',
      time: new Date().toLocaleTimeString(),
    })

    const amountInCents = Math.round(parseFloat(amount) * 100)
    router.push(
      `/crypto/checkout?amount=${amountInCents}&licenseType=${licenseType}&imageId=${imageId}`
    )
  }

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <div className='space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <h1 className='text-4xl font-bold'>Payment Methods Test Center</h1>
          <p className='text-lg text-gray-600'>
            Test and compare Stripe, PayPal, and Cryptocurrency payment flows
          </p>
        </div>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Configure the payment details for testing all methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div className='space-y-2'>
                <label htmlFor='imageId' className='text-sm font-medium'>
                  Image ID
                </label>
                <Input
                  id='imageId'
                  value={imageId}
                  onChange={e => setImageId(e.target.value)}
                  placeholder='test-image-123.jpg'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='licenseType' className='text-sm font-medium'>
                  License Type
                </label>
                <select
                  id='licenseType'
                  value={licenseType}
                  onChange={e => {
                    setLicenseType(e.target.value)
                    const selected = licenseOptions.find(
                      opt => opt.value === e.target.value
                    )
                    if (selected) setAmount(selected.price.toFixed(2))
                  }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {licenseOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - ${option.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label htmlFor='amount' className='text-sm font-medium'>
                  Amount (USD)
                </label>
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder='10.00'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Total Amount</label>
                <div className='px-3 py-2 bg-gray-50 rounded-md border'>
                  <span className='text-2xl font-bold text-green-600'>
                    ${amount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Stripe */}
          <Card className='border-2 border-purple-200 hover:border-purple-400 transition-colors'>
            <CardHeader className='text-center pb-6'>
              <div className='flex justify-center mb-4'>
                <div className='p-4 bg-purple-100 rounded-full'>
                  <CreditCard className='h-8 w-8 text-purple-600' />
                </div>
              </div>
              <CardTitle className='text-purple-600 text-xl'>Stripe</CardTitle>
              <CardDescription className='text-base'>
                Credit card processing with instant checkout
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-purple-50 p-4 rounded-lg'>
                <h4 className='font-semibold mb-3'>Features:</h4>
                <ul className='space-y-2 text-sm text-gray-600'>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-purple-400 rounded-full mr-2'></span>
                    Credit/Debit cards
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-purple-400 rounded-full mr-2'></span>
                    Apple Pay / Google Pay
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-purple-400 rounded-full mr-2'></span>
                    Instant processing
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-purple-400 rounded-full mr-2'></span>
                    2.9% + 30¢ fee
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleStripePayment}
                disabled={isLoading === 'stripe'}
                className='w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg'
              >
                {isLoading === 'stripe'
                  ? 'Processing...'
                  : `Pay $${amount} with Stripe`}
              </Button>
              <div className='text-xs text-gray-500 text-center'>
                Test card: 4242 4242 4242 4242
              </div>
            </CardContent>
          </Card>

          {/* PayPal */}
          <Card className='border-2 border-blue-200 hover:border-blue-400 transition-colors'>
            <CardHeader className='text-center pb-6'>
              <div className='flex justify-center mb-4'>
                <div className='p-4 bg-blue-100 rounded-full'>
                  <DollarSign className='h-8 w-8 text-blue-600' />
                </div>
              </div>
              <CardTitle className='text-blue-600 text-xl'>PayPal</CardTitle>
              <CardDescription className='text-base'>
                PayPal account or guest checkout
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-blue-50 p-4 rounded-lg'>
                <h4 className='font-semibold mb-3'>Features:</h4>
                <ul className='space-y-2 text-sm text-gray-600'>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-400 rounded-full mr-2'></span>
                    PayPal account
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-400 rounded-full mr-2'></span>
                    Guest checkout
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-400 rounded-full mr-2'></span>
                    Buyer protection
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-400 rounded-full mr-2'></span>
                    2.9% + fixed fee
                  </li>
                </ul>
              </div>
              <Button
                onClick={handlePayPalPayment}
                disabled={isLoading === 'paypal'}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg'
              >
                {isLoading === 'paypal'
                  ? 'Processing...'
                  : `Pay $${amount} with PayPal`}
              </Button>
              <div className='text-xs text-gray-500 text-center'>
                Use PayPal sandbox account
              </div>
            </CardContent>
          </Card>

          {/* Cryptocurrency */}
          <Card className='border-2 border-orange-200 hover:border-orange-400 transition-colors'>
            <CardHeader className='text-center pb-6'>
              <div className='flex justify-center mb-4'>
                <div className='p-4 bg-orange-100 rounded-full'>
                  <Bitcoin className='h-8 w-8 text-orange-600' />
                </div>
              </div>
              <CardTitle className='text-orange-600 text-xl'>
                Cryptocurrency
              </CardTitle>
              <CardDescription className='text-base'>
                Bitcoin, Ethereum, and other cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-orange-50 p-4 rounded-lg'>
                <h4 className='font-semibold mb-3'>Features:</h4>
                <ul className='space-y-2 text-sm text-gray-600'>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-orange-400 rounded-full mr-2'></span>
                    Bitcoin, Ethereum
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-orange-400 rounded-full mr-2'></span>
                    Decentralized
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-orange-400 rounded-full mr-2'></span>
                    Lower fees
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-orange-400 rounded-full mr-2'></span>
                    ~1% network fee
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleCryptoPayment}
                disabled={isLoading === 'crypto'}
                className='w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg'
              >
                {isLoading === 'crypto'
                  ? 'Processing...'
                  : `Pay $${amount} with Crypto`}
              </Button>
              <div className='text-xs text-gray-500 text-center'>
                Use testnet cryptocurrencies
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Results */}
        {lastResult && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-lg'>Last Payment Attempt</CardTitle>
                <CardDescription>
                  Results from your most recent payment test
                </CardDescription>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setLastResult(null)}
              >
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className={`p-4 rounded-lg border-l-4 ${
                  lastResult.status === 'success'
                    ? 'border-green-500 bg-green-50'
                    : lastResult.status === 'error'
                      ? 'border-red-500 bg-red-50'
                      : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center'>
                    <AlertCircle className='h-4 w-4 mr-2' />
                    <strong>{lastResult.method}</strong>
                    <span
                      className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        lastResult.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : lastResult.status === 'error'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {lastResult.status.toUpperCase()}
                    </span>
                  </div>
                  <span className='text-sm text-gray-500'>
                    {lastResult.time}
                  </span>
                </div>
                <p className='text-sm'>{lastResult.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div className='space-y-2'>
                <h4 className='font-semibold text-purple-600'>
                  Stripe Testing
                </h4>
                <p className='text-sm text-gray-600'>
                  Use test card:{' '}
                  <code className='bg-gray-100 px-1 rounded'>
                    4242 4242 4242 4242
                  </code>
                  <br />
                  Any future date, any CVC
                </p>
              </div>
              <div className='space-y-2'>
                <h4 className='font-semibold text-blue-600'>PayPal Testing</h4>
                <p className='text-sm text-gray-600'>
                  Use PayPal sandbox account or test credit card in sandbox
                  environment
                </p>
              </div>
              <div className='space-y-2'>
                <h4 className='font-semibold text-orange-600'>
                  Crypto Testing
                </h4>
                <p className='text-sm text-gray-600'>
                  Use testnet cryptocurrencies or Coinbase Commerce test mode
                </p>
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='flex items-start space-x-3 p-4 bg-blue-50 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5' />
                <div>
                  <h4 className='font-semibold text-blue-900'>
                    Important Note
                  </h4>
                  <p className='text-sm text-blue-800'>
                    This is a test environment. All payments are processed in
                    sandbox/test mode. No real money will be charged.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
