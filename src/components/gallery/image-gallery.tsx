'use client'

import { useState, useMemo } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { ImageCard } from './image-card'
import { ImageModal } from './image-modal'
import { DeleteConfirm } from './delete-confirm'
import { GalleryFilters, GalleryFilters as FilterType } from './gallery-filters'
import { useGallery } from '@/hooks/use-gallery'
import { Image as ImageType } from '@/types/image'
import { downloadImage } from '@/lib/supabase/storage'
import { cn } from '@/lib/utils/cn'

interface ImageGalleryProps {
  className?: string
}

export function ImageGallery({ className }: ImageGalleryProps) {
  const {
    images,
    loading,
    error,
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

  // Filter state
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    tags: [],
  })

  // Extract all available tags from images (simplified for now since tags don't exist in the Image type)
  const availableTags = useMemo(() => {
    return [] // No tags in the current Image type
  }, [images])

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let filtered = [...images]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        image =>
          image.original_name.toLowerCase().includes(searchLower) ||
          image.filename.toLowerCase().includes(searchLower)
      )
    }

    // Tags filter (disabled for now since tags don't exist)
    // if (filters.tags.length > 0) {
    //   filtered = filtered.filter((image) =>
    //     filters.tags.every((tag) => image.tags?.includes(tag))
    //   );
    // }

    // Date range filter
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

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'original_name':
          aValue = a.original_name.toLowerCase()
          bValue = b.original_name.toLowerCase()
          break
        case 'file_size':
          aValue = a.file_size
          bValue = b.file_size
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

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

  const handleRefresh = () => {
    refetch()
    showToast('Gallery refreshed', 'success')
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
        filters={filters}
        availableTags={availableTags}
        onFiltersChange={setFilters}
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
            />
          ))}
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
    </div>
  )
}
