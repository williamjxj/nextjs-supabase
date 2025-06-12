'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Maximize2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Image as ImageType } from '@/types/image'
import { formatDistanceToNow } from 'date-fns'
import { useSubscriptionAccess } from '@/hooks/use-subscription-access'
import Link from 'next/link'

interface ImageModalProps {
  image: ImageType | null
  images: ImageType[]
  isOpen: boolean
  onClose: () => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
}

export function ImageModal({
  image,
  images,
  isOpen,
  onClose,
  onDelete,
  onDownload,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const {
    hasAccess,
    currentTier,
    loading: accessLoading,
  } = useSubscriptionAccess()

  useEffect(() => {
    if (image && images.length > 0) {
      const index = images.findIndex(img => img.id === image.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }
  }, [image, images])

  const currentImage = images[currentIndex] || image

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
    setImageError(false)
  }, [images.length])

  const goToNext = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
    setImageError(false)
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  const handleDownloadClick = () => {
    if (!currentImage) return

    // Check if user can download based on subscription
    if (hasAccess()) {
      onDownload(currentImage)
    } else {
      setShowUpgradePrompt(true)
    }
  }

  const handleUpgradePromptClose = () => {
    setShowUpgradePrompt(false)
  }

  const handleViewFullSize = () => {
    if (!currentImage) return

    // Construct the direct public URL to the full-size image
    // This avoids hydration issues by not using the Supabase client during SSR
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
    const fullSizeUrl = `${supabaseUrl}/storage/v1/object/public/images/${currentImage.storage_path}`

    // Open the direct URL in a new tab for full resolution viewing
    window.open(fullSizeUrl, '_blank')
  }

  const handleDownload = async () => {
    if (!currentImage) return

    // Check if user can download based on subscription
    if (hasAccess()) {
      setIsLoading(true)
      try {
        await onDownload(currentImage)
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowUpgradePrompt(true)
    }
  }

  const handleDelete = () => {
    if (!currentImage) return
    onDelete(currentImage)
    if (images.length <= 1) {
      onClose()
    } else {
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!currentImage) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='full'>
      <div className='flex h-full flex-col bg-black'>
        {/* Header */}
        <div className='flex items-center justify-between bg-black/80 p-4 text-white'>
          <div className='flex items-center gap-4'>
            <h2 className='text-lg font-semibold'>
              {currentImage.original_name}
            </h2>
            {images.length > 1 && (
              <span className='text-sm text-gray-300'>
                {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleViewFullSize}
              className='text-white hover:bg-white/20 cursor-pointer'
              title='Open full size in new tab'
            >
              <ExternalLink className='h-4 w-4' />
              View Large
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDownload}
              disabled={isLoading}
              className='text-white hover:bg-white/20 cursor-pointer'
              title='Download image'
            >
              <Download className='h-4 w-4' />
              Download
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDelete}
              className='text-red-400 hover:bg-red-500/20 cursor-pointer'
              title='Delete image'
            >
              <Trash2 className='h-4 w-4' />
              Delete
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='text-white hover:bg-white/20 cursor-pointer'
              title='Close modal'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div
          className='relative flex-1 flex items-center justify-center cursor-pointer'
          onClick={handleViewFullSize}
          title='Click to view large'
        >
          {!imageError ? (
            <Image
              src={currentImage.storage_url}
              alt={currentImage.original_name}
              fill
              className='object-contain'
              onError={() => setImageError(true)}
              priority
            />
          ) : (
            <div className='flex h-full items-center justify-center text-white'>
              <span>Failed to load image</span>
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={goToPrevious}
                className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 cursor-pointer'
                title='Previous image'
              >
                <ChevronLeft className='h-6 w-6' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={goToNext}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 cursor-pointer'
                title='Next image'
              >
                <ChevronRight className='h-6 w-6' />
              </Button>
            </>
          )}

          {showUpgradePrompt && currentImage && (
            <div className='absolute inset-0 z-20 flex items-center justify-center bg-black/70'>
              <div className='bg-white p-6 rounded-lg max-w-md mx-4'>
                <h3 className='text-lg font-semibold mb-4'>Upgrade Required</h3>
                <p className='text-gray-600 mb-4'>
                  {!currentTier
                    ? 'You need an active subscription to download images.'
                    : 'Your current plan has reached the download limit.'}
                </p>
                <div className='flex gap-3'>
                  <Link href='/membership'>
                    <Button>View Plans</Button>
                  </Link>
                  <Button variant='outline' onClick={handleUpgradePromptClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        <div className='bg-black/80 p-4 text-white'>
          <div className='space-y-2'>
            <div className='flex items-center gap-4 text-xs text-gray-400'>
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <span>
                  {formatDistanceToNow(new Date(currentImage.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <span>{formatFileSize(currentImage.file_size)}</span>
              {currentImage.width && currentImage.height && (
                <span>
                  {currentImage.width}×{currentImage.height}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
