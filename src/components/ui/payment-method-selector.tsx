'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkoutWithStripe } from '@/lib/actions/subscription-simplified'
import { SubscriptionPlanType } from '@/lib/subscription-config'
import { CreditCard, DollarSign, Bitcoin, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/components/ui/toast'

// Payment method type
type PaymentMethod = 'stripe' | 'paypal' | 'crypto'

interface PaymentMethodSelectorProps {
  isOpen: boolean
  onClose: () => void
  planType: SubscriptionPlanType
  billingInterval: 'monthly' | 'yearly'
}

export function PaymentMethodSelector({
  isOpen,
  onClose,
  planType,
  billingInterval,
}: PaymentMethodSelectorProps) {
  const [loading, setLoading] = useState<PaymentMethod | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setLoading(method)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      switch (method) {
        case 'stripe':
          await checkoutWithStripe({ planType, billingInterval })
          break

        case 'paypal':
          const paypalResponse = await fetch('/api/paypal/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planType, billingInterval }),
          })
          const paypalData = await paypalResponse.json()
          if (paypalData.approvalUrl) {
            window.location.href = paypalData.approvalUrl
          } else {
            throw new Error(paypalData.error || 'PayPal checkout failed')
          }
          break

        case 'crypto':
          const cryptoResponse = await fetch('/api/crypto/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planType, billingInterval }),
          })
          const cryptoData = await cryptoResponse.json()
          if (cryptoData.hostedUrl) {
            window.location.href = cryptoData.hostedUrl
          } else {
            throw new Error(
              cryptoData.error || 'Cryptocurrency checkout failed'
            )
          }
          break
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      showToast(
        error instanceof Error ? error.message : 'Checkout failed',
        'error',
        'Payment Error'
      )
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors'
        >
          <X className='w-5 h-5 text-gray-500' />
        </button>

        {/* Header */}
        <div className='text-center mb-6'>
          <h3 className='text-2xl font-bold text-gray-900 mb-2'>
            Choose Payment Method
          </h3>
          <p className='text-sm text-gray-600'>
            Select how you&apos;d like to pay for your subscription
          </p>
        </div>

        {/* Payment Options */}
        <div className='space-y-3'>
          {/* Stripe Payment */}
          <button
            onClick={() => handlePaymentMethodSelect('stripe')}
            disabled={!!loading}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
              'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading === 'stripe' ? (
              <div className='flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                <span className='ml-2'>Processing...</span>
              </div>
            ) : (
              <>
                <CreditCard className='w-5 h-5' />
                <span>Credit/Debit Card</span>
                <span className='text-xs bg-blue-500 px-2 py-1 rounded-full'>
                  Recommended
                </span>
              </>
            )}
          </button>

          {/* PayPal Payment */}
          <button
            onClick={() => handlePaymentMethodSelect('paypal')}
            disabled={!!loading}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
              'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading === 'paypal' ? (
              <div className='flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                <span className='ml-2'>Processing...</span>
              </div>
            ) : (
              <>
                <DollarSign className='w-5 h-5' />
                <span>PayPal</span>
              </>
            )}
          </button>

          {/* Crypto Payment */}
          <button
            onClick={() => handlePaymentMethodSelect('crypto')}
            disabled={!!loading}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 border-2',
              'bg-orange-500 text-white hover:bg-orange-600 border-orange-500',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading === 'crypto' ? (
              <div className='flex items-center justify-center'>
                <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                <span className='ml-2'>Processing...</span>
              </div>
            ) : (
              <>
                <Bitcoin className='w-5 h-5' />
                <span>Cryptocurrency</span>
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
          <p className='text-xs text-gray-600 text-center'>
            🔒 All payments are secured with 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  )
}
