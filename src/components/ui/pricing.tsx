'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkoutWithStripe } from '@/lib/actions/subscription-simplified'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
} from '@/lib/subscription-config'
import { Check, Crown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PricingProps {
  className?: string
  showTitle?: boolean
  variant?: 'default' | 'compact'
}

export default function Pricing({
  className,
  showTitle = true,
  variant = 'default',
}: PricingProps) {
  const [loading, setLoading] = useState<string>()
  const router = useRouter()

  const handleStripeCheckout = async (planType: SubscriptionPlanType) => {
    setLoading(planType)
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
      await checkoutWithStripe({ planType, billingInterval: 'monthly' })
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(undefined)
    }
  }

  return (
    <div className={cn('', className)}>
      {showTitle && (
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Choose Your Plan
          </h2>
          <p className='text-gray-300 max-w-2xl mx-auto'>
            Get unlimited access to our premium gallery with subscription plans
            designed to fit your needs.
          </p>
        </div>
      )}

      <div
        className={cn(
          'grid gap-6',
          variant === 'compact'
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-3'
        )}
      >
        {Object.entries(SUBSCRIPTION_PLANS).map(([planType, plan]) => {
          const isPopular = planType === 'premium'

          return (
            <div
              key={planType}
              className={cn(
                'relative rounded-lg border bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow',
                isPopular
                  ? 'border-pink-500 ring-2 ring-pink-500/20'
                  : 'border-gray-200'
              )}
            >
              {isPopular && (
                <div className='absolute -top-1 left-1/2 transform -translate-x-1/2'>
                  <div className='flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full'>
                    <Crown className='w-3 h-3' />
                    Most Popular
                  </div>
                </div>
              )}

              <div className='p-6'>
                <div className='text-center'>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    {plan.name}
                  </h3>

                  <p className='text-sm text-gray-600 mb-4'>
                    {plan.description}
                  </p>

                  <div className='mb-6'>
                    <span className='text-4xl font-bold text-gray-900'>
                      ${plan.priceMonthly.toFixed(2)}
                    </span>
                    <span className='text-gray-600'>/month</span>
                  </div>
                </div>

                <ul className='space-y-3 mb-6'>
                  {plan.features.map(feature => (
                    <li key={feature} className='flex items-start gap-3'>
                      <Check className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                      <span className='text-sm text-gray-700'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    handleStripeCheckout(planType as SubscriptionPlanType)
                  }
                  disabled={!!loading}
                  className={cn(
                    'w-full py-3 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isPopular
                      ? 'bg-pink-500 hover:bg-pink-600 text-white focus:ring-pink-500'
                      : 'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-500',
                    loading === planType && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading === planType ? (
                    <div className='flex items-center justify-center'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Processing...
                    </div>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className='text-center mt-8'>
        <p className='text-sm text-gray-500'>
          All plans include 7-day free trial • Cancel anytime • No setup fees
        </p>
      </div>
    </div>
  )
}
