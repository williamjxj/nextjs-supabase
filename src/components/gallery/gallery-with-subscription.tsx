'use client'

import { useState, useEffect } from 'react'
import { UnifiedImageCard } from './unified-image-card'
import type { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'
import { Grid, List, Columns, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryWithSubscriptionProps {
  images: ImageType[]
  onImageView: (image: ImageType) => void
  onImageViewFullSize: (image: ImageType) => void
  onImageDelete: (image: ImageType) => void
  onImageDownload: (image: ImageType) => void
  onImageCheckout: (image: ImageType) => void
  loading?: boolean
  className?: string
}

type ViewMode = 'grid' | 'list' | 'masonry'

export function GalleryWithSubscription({
  images,
  onImageView,
  onImageViewFullSize,
  onImageDelete,
  onImageDownload,
  onImageCheckout,
  loading = false,
  className,
}: GalleryWithSubscriptionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  const getGridClasses = () => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
      case 'list':
        return 'space-y-4'
      case 'masonry':
        return 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6'
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* View Mode Controls */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-700'>View:</span>
          <div className='flex items-center border border-gray-200 rounded-lg p-1'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
              className='h-8 w-8 p-0'
            >
              <Grid className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              className='h-8 w-8 p-0'
            >
              <List className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('masonry')}
              className='h-8 w-8 p-0'
            >
              <Columns className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='text-sm text-gray-600'>
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='flex items-center justify-center p-12'>
          <Loader2 className='h-8 w-8 animate-spin mr-2' />
          <span>Loading images...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <Grid className='h-16 w-16 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No images found
          </h3>
          <p className='text-gray-600'>
            Upload some images to get started with your gallery.
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {!loading && images.length > 0 && (
        <div className={getGridClasses()}>
          {images.map(image => (
            <div
              key={image.id}
              className={cn(
                viewMode === 'masonry' && 'break-inside-avoid mb-6'
              )}
            >
              <UnifiedImageCard
                image={image}
                onView={onImageView}
                onViewFullSize={onImageViewFullSize}
                onDelete={onImageDelete}
                onDownload={onImageDownload}
                onCheckout={onImageCheckout}
                viewMode={viewMode}
                showActions={true}
                showAccessInfo={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export a simpler version for basic usage
export function SimpleGallery({
  images,
  onImageView,
  onImageDelete,
  loading = false,
  className,
}: {
  images: ImageType[]
  onImageView: (image: ImageType) => void
  onImageDelete: (image: ImageType) => void
  loading?: boolean
  className?: string
}) {
  const handleNoOp = () => {
    // No-op function for unused handlers
  }

  return (
    <GalleryWithSubscription
      images={images}
      onImageView={onImageView}
      onImageViewFullSize={onImageView}
      onImageDelete={onImageDelete}
      onImageDownload={handleNoOp}
      onImageCheckout={handleNoOp}
      loading={loading}
      className={className}
    />
  )
}

// Export a read-only version
export function ReadOnlyGallery({
  images,
  onImageView,
  loading = false,
  className,
}: {
  images: ImageType[]
  onImageView: (image: ImageType) => void
  loading?: boolean
  className?: string
}) {
  const handleNoOp = () => {
    // No-op function for unused handlers
  }

  return (
    <div className={cn('w-full', className)}>
      {loading && (
        <div className='flex items-center justify-center p-12'>
          <Loader2 className='h-8 w-8 animate-spin mr-2' />
          <span>Loading images...</span>
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <Grid className='h-16 w-16 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No images available
          </h3>
          <p className='text-gray-600'>Check back later for new images.</p>
        </div>
      )}

      {!loading && images.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {images.map(image => (
            <UnifiedImageCard
              key={image.id}
              image={image}
              onView={onImageView}
              onViewFullSize={onImageView}
              onDelete={handleNoOp}
              onDownload={handleNoOp}
              onCheckout={handleNoOp}
              viewMode='grid'
              showActions={false}
              showAccessInfo={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
