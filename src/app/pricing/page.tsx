'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new membership page
    router.push('/membership')
  }, [router])

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          Redirecting...
        </h1>
        <p className='text-gray-600'>Taking you to our membership page</p>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4'></div>
      </div>
    </div>
  )
}
