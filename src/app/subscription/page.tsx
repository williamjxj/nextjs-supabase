'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LicenseSelector } from '@/components/gallery/license-selector'
import { Image as ImageType } from '@/types/image'
import { useGallery } from '@/hooks/use-gallery' // To get a sample image
import { useToast } from '@/components/ui/toast'

export default function SubscriptionPage() {
  const [isLicenseSelectorOpen, setIsLicenseSelectorOpen] = useState(true) // Show by default
  const [checkoutImage, setCheckoutImage] = useState<ImageType | null>(null)
  const { images, loading: galleryLoading, error: galleryError } = useGallery() // Fetch images to get a sample
  const { showToast } = useToast()

  // Set a placeholder image for the LicenseSelector to function
  // It needs an image object, but for subscriptions, the image itself is not the purchased item.
  useEffect(() => {
    if (images && images.length > 0) {
      setCheckoutImage(images[0])
    } else if (!galleryLoading && !galleryError) {
      // If no images and not loading, create a dummy/placeholder image
      // This allows LicenseSelector to render even if the gallery is empty or still loading.
      // The actual subscription isn't tied to this specific image.
      const placeholderImage: ImageType = {
        id: 'placeholder-subscription-image',
        created_at: new Date().toISOString(),
        original_name: 'Subscription Plan Image',
        filename: 'subscription-placeholder.jpg',
        storage_path: 'public/subscription-placeholder.jpg', // Corrected: file_path to storage_path, assuming it's a path within a bucket
        file_size: 0,
        storage_url: '/images/subscription-placeholder.jpg', // A generic image URL, ensure this image exists or use a valid remote one
        user_id: 'system',
        updated_at: new Date().toISOString(),
        width: 100,
        height: 100,
        mime_type: 'image/jpeg',
      }
      setCheckoutImage(placeholderImage)
    }
  }, [images, galleryLoading, galleryError]) // Corrected: useState to useEffect

  const handleLicenseCheckout = async (
    image: ImageType,
    licenseType: 'standard' | 'premium' | 'commercial'
  ) => {
    try {
      showToast('Processing subscription... (redirecting to checkout)', 'info')
      // This would be your actual subscription checkout logic,
      // possibly different from single image checkout
      const response = await fetch('/api/stripe/checkout', {
        // Or a new /api/subscription/checkout
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // For subscriptions, you might send a planId instead of imageId
          // imageId: image.id,
          licenseType, // This might represent a subscription tier
          // planId: `plan_${licenseType}`, // Example
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error initiating subscription checkout:', error)
      showToast(
        `Failed to start subscription: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'error'
      )
    } finally {
      setIsLicenseSelectorOpen(false)
    }
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-6 text-gray-800'>
        Subscription Plans
      </h1>
      <p className='mb-8 text-gray-600'>
        Choose a subscription plan to get access to our image library.
      </p>

      {galleryLoading && (
        <div className='text-center py-12'>
          <p className='text-gray-600'>Loading subscription plans...</p>
          {/* You could add a spinner here */}
        </div>
      )}

      {galleryError && (
        <div className='text-center py-12'>
          <p className='text-red-500'>
            Error loading subscription information. Please try again later.
          </p>
        </div>
      )}

      {!galleryLoading && !galleryError && checkoutImage && (
        <LicenseSelector
          image={checkoutImage} // The image is a placeholder for the license UI
          isOpen={isLicenseSelectorOpen} // This will be true by default
          onClose={() => {
            // For a direct view, onClose might navigate away or not be strictly necessary
            // Or it could hide the selector if you add a toggle back
            setIsLicenseSelectorOpen(false)
            // showToast('Subscription plan selection closed.', 'info');
          }}
          onCheckout={handleLicenseCheckout}
          // You might want to add a prop to LicenseSelector to change its appearance
          // if it's being used for subscriptions directly vs. as a modal for a specific image.
          // e.g., displayMode="subscription"
        />
      )}

      {!galleryLoading && !galleryError && !checkoutImage && (
        <div className='text-center py-12'>
          <p className='text-gray-600'>Preparing subscription options...</p>
        </div>
      )}
    </div>
  )
}
