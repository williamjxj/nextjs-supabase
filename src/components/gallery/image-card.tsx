'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Trash2, Eye, Calendar, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

interface ImageCardProps {
  image: ImageType
  onView: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout: (image: ImageType) => void
  isPurchased: boolean
  viewMode?: 'grid' | 'list'
  className?: string
}

export function ImageCard({
  image,
  onView,
  onDelete,
  onDownload,
  onCheckout,
  isPurchased,
  viewMode = 'grid',
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
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'krea-card p-4 hover:shadow-md transition-all duration-200',
          className
        )}
      >
        <div className='flex items-center gap-4'>
          {/* Thumbnail */}
          <div className='relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0'>
            {!imageError ? (
              <Image
                src={image.storage_url || '/placeholder.svg'}
                alt={image.original_name}
                fill
                className='object-cover'
                onError={() => setImageError(true)}
                sizes='64px'
              />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <span className='text-gray-400 text-xs'>Error</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-gray-900 truncate mb-1'>
              {image.original_name}
            </h3>
            <div className='flex items-center gap-4 text-sm text-gray-500'>
              <span>{formatFileSize(image.file_size)}</span>
              {image.width && image.height && (
                <span>
                  {image.width} × {image.height}
                </span>
              )}
              <span>
                {formatDistanceToNow(new Date(image.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onView(image)}
              className='h-8 w-8 p-0 hover:bg-gray-100 rounded-full'
            >
              <Eye className='h-4 w-4' />
            </Button>

            {isPurchased ? (
              <Button
                size='sm'
                variant='ghost'
                onClick={handleDownload}
                disabled={isLoading}
                className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full'
              >
                <Download className='h-4 w-4' />
              </Button>
            ) : (
              <Button
                size='sm'
                onClick={handleCheckout}
                className='h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs'
              >
                <ShoppingCart className='h-3 w-3 mr-1' />
                Buy
              </Button>
            )}

            <Button
              size='sm'
              variant='ghost'
              onClick={() => onDelete(image)}
              className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-full'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('krea-gallery-item group', className)}>
      {/* Image Container */}
      <div className='relative aspect-square overflow-hidden bg-gray-100'>
        {!imageError ? (
          <Image
            src={image.storage_url || '/placeholder.svg'}
            alt={image.original_name}
            fill
            className='object-cover transition-transform group-hover:scale-105 duration-300'
            onError={() => setImageError(true)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            loading='lazy'
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-gray-200'>
            <span className='text-gray-500'>Failed to load</span>
          </div>
        )}

        {/* Overlay with actions */}
        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200'>
          <div className='absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => onView(image)}
              className='h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm rounded-full'
            >
              <Eye className='h-4 w-4' />
            </Button>

            {isPurchased ? (
              <Button
                size='sm'
                variant='secondary'
                onClick={handleDownload}
                disabled={isLoading}
                className='h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm rounded-full'
              >
                <Download className='h-4 w-4' />
              </Button>
            ) : (
              <Button
                size='sm'
                onClick={handleCheckout}
                className='h-8 w-8 p-0 bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 shadow-sm rounded-full'
              >
                <ShoppingCart className='h-4 w-4 text-white' />
              </Button>
            )}

            <Button
              size='sm'
              variant='destructive'
              onClick={() => onDelete(image)}
              className='h-8 w-8 p-0 bg-red-500/90 backdrop-blur-sm hover:bg-red-600 shadow-sm rounded-full'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Purchase status indicator */}
        {isPurchased && (
          <div className='absolute top-3 left-3'>
            <div className='bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
              Owned
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className='p-4 bg-white'>
        <h3
          className='font-medium text-gray-900 truncate mb-2'
          title={image.original_name}
        >
          {image.original_name}
        </h3>

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

        {image.width && image.height && (
          <div className='text-xs text-gray-500 mt-1'>
            {image.width} × {image.height}px
          </div>
        )}
      </div>
    </div>
  )
}
