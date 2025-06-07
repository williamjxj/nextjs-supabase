'use client'

import { useState, useMemo } from 'react'
import { Upload, RefreshCw, Grid3X3, List, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { ImageCard } from './image-card'
import { ImageModal } from './image-modal'
import { DeleteConfirm } from './delete-confirm'
import { LicenseSelector } from './license-selector'
import { PaymentOptionsModal } from '../membership/payment-options-modal'
import {
  GalleryFilters,
  type GalleryFilters as FilterType,
} from './gallery-filters'
import { Pagination } from './pagination'
import { useGallery } from '@/hooks/use-gallery'
import type { Image as ImageType } from '@/types/image'
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Extract all available tags from images
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
      <div className='flex items-center justify-center py-20'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='mt-4 text-gray-600'>Loading your gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-20'>
        <div className='krea-card max-w-md mx-auto p-8'>
          <p className='text-red-600 mb-4'>Failed to load gallery</p>
          <Button onClick={handleRefresh} className='krea-button-primary'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className='container mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              My Gallery
            </h1>
            <p className='text-gray-600'>
              {images.length} {images.length === 1 ? 'image' : 'images'}
              {filteredImages.length !== images.length && (
                <span> · {filteredImages.length} shown</span>
              )}
            </p>
          </div>

          <div className='flex items-center gap-3'>
            {/* View Mode Toggle */}
            <div className='flex items-center bg-white rounded-full p-1 border border-gray-200'>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-full transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Grid3X3 className='w-4 h-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-full transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className='w-4 h-4' />
              </button>
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'krea-button',
                showFilters && 'bg-blue-50 border-blue-200 text-blue-700'
              )}
            >
              <Filter className='h-4 w-4 mr-2' />
              Filters
            </Button>

            <Button onClick={handleRefresh} className='krea-button'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>

            <Link href='/upload'>
              <Button className='krea-button-primary'>
                <Upload className='h-4 w-4 mr-2' />
                Upload Images
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className='krea-card p-6 mb-8'>
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
          </div>
        )}

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <div className='text-center py-20'>
            <div className='krea-card max-w-md mx-auto p-12'>
              {images.length === 0 ? (
                <>
                  <div className='w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                    <Upload className='w-8 h-8 text-gray-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No images yet
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Start building your gallery by uploading your first image
                  </p>
                  <Link href='/upload'>
                    <Button className='krea-button-primary'>
                      <Upload className='h-4 w-4 mr-2' />
                      Upload Your First Image
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className='w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                    <Search className='w-8 h-8 text-gray-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No results found
                  </h3>
                  <p className='text-gray-600'>
                    Try adjusting your filters or search terms
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
            )}
          >
            {filteredImages.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                onView={handleViewImage}
                onDelete={handleDeleteClick}
                onDownload={handleDownload}
                onCheckout={handleCheckout}
                isPurchased={image.isPurchased}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && totalPages > 1 && (
          <div className='flex justify-center pt-12'>
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
          <div className='text-center text-sm text-gray-500 pt-8'>
            Showing {filteredImages.length} of {pagination.total} images
            {totalPages > 1 && (
              <span>
                {' '}
                · Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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
