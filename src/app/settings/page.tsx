'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the account settings page
    router.push('/account/settings')
  }, [router])

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          Redirecting...
        </h1>
        <p className='text-gray-600'>Taking you to account settings</p>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4'></div>
      </div>
    </div>
  )
}
