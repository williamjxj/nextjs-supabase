'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Download, ArrowLeft } from 'lucide-react'

interface PurchaseDetails {
  imageId: string
  imageName: string
  imageUrl: string
  licenseType: string
  amount: number
  currency: string
  paymentStatus: string
  sessionId: string
  purchasedAt?: string
  fileSize?: number
  mimeType?: string
}

function PurchaseSuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId') // Added for PayPal
  const method = searchParams.get('method') // Added to check payment method
  const sessionIdFromStripe = searchParams.get('session_id') // Existing for Stripe

  // Determine the correct session ID based on the payment method
  const sessionId = method === 'paypal' ? paymentId : sessionIdFromStripe

  const [purchaseDetails, setPurchaseDetails] =
    useState<PurchaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    // Fetch real purchase details from the API
    const fetchPurchaseDetails = async () => {
      try {
        const response = await fetch(
          `/api/purchase/details?session_id=${sessionId}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch purchase details')
        }

        const data = await response.json()
        setPurchaseDetails(data)
      } catch (err) {
        console.error('Error fetching purchase details:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load purchase details'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseDetails()
  }, [sessionId])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Processing your purchase...</p>
        </div>
      </div>
    )
  }

  if (error || !purchaseDetails) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center'>
          <div className='text-red-500 mb-4'>
            <svg
              className='w-12 h-12 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h1 className='text-xl font-semibold text-gray-900 mb-2'>
            Purchase Error
          </h1>
          <p className='text-gray-600 mb-6'>
            {error || 'Unable to retrieve purchase details'}
          </p>
          <Link
            href='/gallery'
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Gallery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          {/* Success Header */}
          <div className='bg-green-50 px-6 py-8 text-center'>
            <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Purchase Successful!
            </h1>
            <p className='text-gray-600'>
              Thank you for your purchase. Your image license is now available.
            </p>
          </div>

          {/* Purchase Details */}
          <div className='px-6 py-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Purchase Details
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Image Preview */}
              <div>
                <Image
                  src={purchaseDetails.imageUrl}
                  alt={purchaseDetails.imageName}
                  width={400}
                  height={192}
                  className='w-full h-48 object-cover rounded-lg border'
                />
              </div>

              {/* Details */}
              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Image Name
                  </label>
                  <p className='text-gray-900'>{purchaseDetails.imageName}</p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    License Type
                  </label>
                  <p className='text-gray-900 capitalize'>
                    {purchaseDetails.licenseType}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Amount Paid
                  </label>
                  <p className='text-gray-900'>
                    ${purchaseDetails.amount.toFixed(2)}{' '}
                    {purchaseDetails.currency.toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Payment Status
                  </label>
                  <p className='text-gray-900 capitalize'>
                    {purchaseDetails.paymentStatus}
                  </p>
                </div>

                {purchaseDetails.purchasedAt && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Purchase Date
                    </label>
                    <p className='text-gray-900'>
                      {new Date(
                        purchaseDetails.purchasedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {purchaseDetails.fileSize && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      File Size
                    </label>
                    <p className='text-gray-900'>
                      {(purchaseDetails.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Session ID
                  </label>
                  <p className='text-gray-900 text-sm font-mono break-all'>
                    {sessionId}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-8 flex flex-col sm:flex-row gap-4'>
              <button
                onClick={() => {
                  // Create a temporary link to download the image
                  const link = document.createElement('a')
                  link.href = purchaseDetails.imageUrl
                  link.download = purchaseDetails.imageName
                  link.target = '_blank'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className='flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
              >
                <Download className='w-5 h-5 mr-2' />
                Download High-Res Image
              </button>

              <Link
                href='/gallery'
                className='flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium'
              >
                <ArrowLeft className='w-5 h-5 mr-2' />
                Back to Gallery
              </Link>
            </div>

            {/* License Information */}
            <div className='mt-8 p-4 bg-gray-50 rounded-lg'>
              <h3 className='font-medium text-gray-900 mb-2'>License Terms</h3>
              <p className='text-sm text-gray-600'>
                This {purchaseDetails.licenseType} license grants you the right
                to use this image according to our standard terms and
                conditions. For more information about usage rights, please
                refer to our licensing agreement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading purchase details...</p>
          </div>
        </div>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  )
}
