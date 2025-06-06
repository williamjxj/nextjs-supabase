'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Trash2, Eye, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

interface ImageCardProps {
  image: ImageType
  onView: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout: (image: ImageType) => void // Added for checkout functionality
  isPurchased: boolean // Added to determine if the image is purchased
  className?: string
}

export function ImageCard({
  image,
  onView,
  onDelete,
  onDownload,
  onCheckout,
  isPurchased,
  className,
}: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      await onDownload(image)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      await onCheckout(image)
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all hover:shadow-lg',
        className
      )}
    >
      {/* Image Container */}
      <div className='relative aspect-square overflow-hidden bg-gray-100'>
        {!imageError ? (
          <Image
            src={image.storage_url}
            alt={image.original_name}
            fill
            className='object-cover transition-transform group-hover:scale-105'
            onError={() => setImageError(true)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            loading='lazy'
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-gray-200'>
            <span className='text-gray-500'>Failed to load image</span>
          </div>
        )}

        {/* Action Buttons - Always visible with better styling */}
        <div className='absolute top-2 right-2 flex flex-col gap-1'>
          <Button
            size='sm'
            variant='secondary'
            onClick={() => onView(image)}
            className='h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm'
            title='View full size'
          >
            <Eye className='h-4 w-4' />
          </Button>
          {isPurchased ? (
            <Button
              size='sm'
              variant='secondary'
              onClick={handleDownload}
              disabled={isLoading}
              className='h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm'
              title='Download'
            >
              <Download className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              size='sm'
              variant='default'
              onClick={handleCheckout}
              className='h-8 w-8 p-0 bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600 shadow-sm'
              title='Checkout'
            >
              <span className='text-white'>Checkout</span>
            </Button>
          )}
          <Button
            size='sm'
            variant='destructive'
            onClick={() => onDelete(image)}
            className='h-8 w-8 p-0 bg-red-500/90 backdrop-blur-sm hover:bg-red-600 shadow-sm'
            title='Delete'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className='p-4'>
        <div className='space-y-2'>
          {/* File Name */}
          <h3 className='font-semibold truncate' title={image.original_name}>
            {image.original_name}
          </h3>

          {/* File Info */}
          <div className='text-sm text-gray-600'>
            <p className='truncate'>{image.mime_type}</p>
            {image.width && image.height && (
              <p className='text-xs'>
                {image.width} × {image.height}px
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <div className='flex items-center gap-1'>
              <Calendar className='h-3 w-3' />
              <span title={new Date(image.created_at).toLocaleString()}>
                {formatDistanceToNow(new Date(image.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <span>{formatFileSize(image.file_size)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
