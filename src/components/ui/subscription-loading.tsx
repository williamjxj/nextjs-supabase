import React from 'react'
import { CheckCircle } from 'lucide-react'

interface SubscriptionHeaderSkeletonProps {
  hasSubscription?: boolean
}

export function SubscriptionHeaderSkeleton({
  hasSubscription = true,
}: SubscriptionHeaderSkeletonProps) {
  if (!hasSubscription) {
    return (
      <div className='text-center mb-12'>
        <div className='animate-pulse'>
          <div className='h-10 bg-gray-200 rounded w-64 mx-auto mb-4'></div>
          <div className='h-6 bg-gray-200 rounded w-96 mx-auto'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='text-center mb-12'>
      <div className='max-w-3xl mx-auto'>
        <div className='flex items-center justify-center gap-3 mb-4'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
            <CheckCircle className='w-6 h-6 text-green-600' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900'>
            Your Current Plan
          </h1>
        </div>

        <div className='bg-white rounded-2xl shadow-lg border border-green-200 p-6 mb-6'>
          {/* Loading skeleton for subscription details */}
          <div className='animate-pulse'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gray-200 rounded-full'></div>
                <div>
                  <div className='h-5 bg-gray-200 rounded w-32 mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded w-24'></div>
                </div>
              </div>
              <div className='text-right'>
                <div className='h-8 bg-gray-200 rounded w-20 mb-1'></div>
                <div className='h-4 bg-gray-200 rounded w-16'></div>
              </div>
            </div>

            {/* Next billing skeleton */}
            <div className='bg-gray-50 rounded-lg p-3 mb-4'>
              <div className='h-4 bg-gray-200 rounded w-40'></div>
            </div>

            {/* Action buttons skeleton */}
            <div className='flex flex-col sm:flex-row items-center gap-3'>
              <div className='h-10 bg-gray-200 rounded-lg w-full sm:w-40'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-full sm:w-32'></div>
            </div>
          </div>
        </div>

        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-80 mx-auto'></div>
        </div>
      </div>
    </div>
  )
}

export function SubscriptionPlanSkeleton() {
  return (
    <div className='text-center mb-12'>
      <div className='animate-pulse'>
        <div className='h-10 bg-gray-200 rounded w-64 mx-auto mb-4'></div>
        <div className='h-6 bg-gray-200 rounded w-96 mx-auto'></div>
      </div>
    </div>
  )
}
