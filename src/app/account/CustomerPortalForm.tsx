'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createStripePortal } from '@/lib/actions/subscription-simplified'

interface Props {
  subscription: any
}

export default function CustomerPortalForm({ subscription }: Props) {
  const router = useRouter()
  const currentPath = usePathname()

  const handleStripePortal = async () => {
    try {
      await createStripePortal(currentPath)
    } catch (error) {
      console.error('Error opening customer portal:', error)
      // Handle error appropriately - could show a toast or error message
    }
  }

  return (
    <div className='space-y-6'>
      <div className='p-6 bg-white rounded-lg shadow'>
        <h3 className='text-lg font-semibold mb-4'>Subscription Details</h3>
        {subscription ? (
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-600'>Current Plan</p>
              <p className='text-lg font-medium'>
                {subscription.prices?.products?.name || 'Unknown Plan'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Status</p>
              <p className='text-lg font-medium capitalize'>
                {subscription.status}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Current Period</p>
              <p className='text-lg font-medium'>
                {new Date(
                  subscription.current_period_start
                ).toLocaleDateString()}{' '}
                -{' '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Price</p>
              <p className='text-lg font-medium'>
                ${(subscription.prices?.unit_amount! / 100).toFixed(2)}/
                {subscription.prices?.interval}
              </p>
            </div>
            {subscription.cancel_at_period_end && (
              <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                <p className='text-sm text-yellow-800'>
                  Your subscription will be canceled at the end of the current
                  billing period.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-gray-500 mb-4'>
              You don&apos;t have an active subscription.
            </p>
            <p className='text-sm text-gray-400'>
              Subscribe to access premium features and content.
            </p>
          </div>
        )}
      </div>

      {subscription && (
        <div className='flex justify-center'>
          <button
            onClick={handleStripePortal}
            className='bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-md font-medium transition-colors'
          >
            Open Customer Portal
          </button>
        </div>
      )}
    </div>
  )
}
