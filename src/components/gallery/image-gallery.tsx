'use client'

import { useState, useMemo, useEffect } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { ImageCard } from './image-card'
import { ImageModal } from './image-modal'
import { DeleteConfirm } from './delete-confirm'
import { LicenseSelector } from './license-selector'
import { PaymentOptionsModal } from '../membership/payment-options-modal'
import { GalleryFilters, GalleryFilters as FilterType } from './gallery-filters'
import { Pagination } from './pagination'
import { useGallery } from '@/hooks/use-gallery'
import { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'

interface ImageGalleryProps {
  className?: string
}

export function ImageGallery({ className }: ImageGalleryProps) {
  const {
    images,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    goToPage,
    goToNextPage,
    goToPrevPage,
    refetch,
    deleteImage: deleteImageFromHook,
    downloadImageFile,
  } = useGallery()
  const { showToast } = useToast()

  // Modal states
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteImage, setDeleteImage] = useState<ImageType | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [checkoutImage, setCheckoutImage] = useState<ImageType | null>(null)
  const [isLicenseSelectorOpen, setIsLicenseSelectorOpen] = useState(false)
  const [isPaymentOptionsOpen, setIsPaymentOptionsOpen] = useState(false)

  // Extract all available tags from images (simplified for now since tags don't exist in the Image type)
  const availableTags = useMemo(() => {
    return [] // No tags in the current Image type
  }, [])

  // Filter and sort images - now handled by the API, but keep for local filtering if needed
  const filteredImages = useMemo(() => {
    let filtered = [...images]

    // Date range filter (client-side for now)
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(image => {
        const imageDate = new Date(image.created_at)
        const start = filters.dateRange?.start
          ? new Date(filters.dateRange.start)
          : null
        const end = filters.dateRange?.end
          ? new Date(filters.dateRange.end)
          : null

        if (start && imageDate < start) return false
        if (end && imageDate > end) return false
        return true
      })
    }

    return filtered
  }, [images, filters])

  const handleViewImage = (image: ImageType) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (image: ImageType) => {
    setDeleteImage(image)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async (image: ImageType) => {
    setIsDeleting(true)
    try {
      await deleteImageFromHook(image)
      showToast('Image deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting image:', error)
      showToast('Failed to delete image', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async (image: ImageType) => {
    try {
      await downloadImageFile(image)
      showToast('Image downloaded successfully', 'success')
    } catch (error) {
      console.error('Error downloading image:', error)
      showToast('Failed to download image', 'error')
    }
  }

  const handleCheckout = (image: ImageType) => {
    setCheckoutImage(image)
    setIsPaymentOptionsOpen(true)
  }

  const handleLicenseCheckout = async (
    image: ImageType,
    licenseType: 'standard' | 'premium' | 'commercial'
  ) => {
    try {
      showToast('Redirecting to checkout...', 'info')

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          licenseType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error initiating checkout:', error)
      showToast('Failed to start checkout process', 'error')
    }
  }

  const handlePaymentMethodSelect = async (
    method: 'stripe' | 'paypal' | 'cybercurrency'
  ) => {
    if (!checkoutImage) return

    try {
      if (method === 'stripe') {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: checkoutImage.id,
            licenseType: checkoutImage.licenseType || 'standard',
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create Stripe checkout session')
        }

        const { url } = await response.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No checkout URL received')
        }
      } else if (method === 'paypal') {
        window.location.href = `/paypal/checkout?imageId=${checkoutImage.id}&licenseType=${checkoutImage.licenseType || 'standard'}&amount=${checkoutImage.amount || 100}`
      } else if (method === 'cybercurrency') {
        window.location.href = `/crypto/checkout?imageId=${checkoutImage.id}&licenseType=${checkoutImage.licenseType || 'standard'}`
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      showToast('Failed to start payment process', 'error')
    }
  }

  const handleRefresh = () => {
    refetch()
    showToast('Gallery refreshed', 'success')
  }

  // Calculate pagination info
  const currentPage = pagination
    ? Math.floor(pagination.offset / pagination.limit) + 1
    : 1
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1
  const hasPrevious = pagination ? pagination.offset > 0 : false
  const hasNext = pagination?.hasMore || false

  // Convert hook filters to component filters format
  const componentFilters: FilterType = {
    search: filters.search || '',
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
    tags: [], // No tags in current implementation
    dateRange: filters.dateRange,
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <LoadingSpinner size='lg' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600 mb-4'>Failed to load gallery</p>
        <Button onClick={handleRefresh} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>My Gallery</h1>
          <p className='text-gray-600'>
            {images.length} {images.length === 1 ? 'image' : 'images'}
            {filteredImages.length !== images.length && (
              <span> · {filteredImages.length} shown</span>
            )}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={handleRefresh} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Link href='/upload'>
            <Button>
              <Upload className='h-4 w-4 mr-2' />
              Upload Images
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <GalleryFilters
        filters={componentFilters}
        availableTags={availableTags}
        onFiltersChange={newFilters => {
          updateFilters({
            search: newFilters.search,
            sortBy: newFilters.sortBy,
            sortOrder: newFilters.sortOrder,
            dateRange: newFilters.dateRange,
          })
        }}
      />

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className='text-center py-12'>
          {images.length === 0 ? (
            <>
              <p className='text-gray-500 mb-4'>
                No images in your gallery yet
              </p>
              <Link href='/upload'>
                <Button>
                  <Upload className='h-4 w-4 mr-2' />
                  Upload Your First Image
                </Button>
              </Link>
            </>
          ) : (
            <p className='text-gray-500'>
              No images match your current filters
            </p>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {filteredImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onView={handleViewImage}
              onDelete={handleDeleteClick}
              onDownload={handleDownload}
              onCheckout={handleCheckout}
              isPurchased={image.isPurchased}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <div className='flex justify-center pt-6'>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onPrevious={goToPrevPage}
            onNext={goToNextPage}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </div>
      )}

      {/* Gallery Statistics */}
      {pagination && (
        <div className='text-center text-sm text-gray-500 pt-4'>
          Showing {filteredImages.length} of {pagination.total} images
          {totalPages > 1 && (
            <span>
              {' '}
              · Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        images={filteredImages}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedImage(null)
        }}
        onDelete={handleDeleteClick}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirm
        image={deleteImage}
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setDeleteImage(null)
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* License Selector Modal */}
      {checkoutImage && (
        <LicenseSelector
          image={checkoutImage}
          isOpen={isLicenseSelectorOpen}
          onClose={() => {
            setIsLicenseSelectorOpen(false)
            setCheckoutImage(null)
          }}
          onCheckout={handleLicenseCheckout}
        />
      )}

      {/* Payment Options Modal */}
      {checkoutImage && (
        <PaymentOptionsModal
          isOpen={isPaymentOptionsOpen}
          onClose={() => setIsPaymentOptionsOpen(false)}
          onSelectPaymentMethod={handlePaymentMethodSelect}
          image={checkoutImage}
        />
      )}
    </div>
  )
}
