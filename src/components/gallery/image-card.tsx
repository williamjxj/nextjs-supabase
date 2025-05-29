'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Trash2, Eye, Calendar, User } from 'lucide-react'
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
  className?: string
}

export function ImageCard({
  image,
  onView,
  onDelete,
  onDownload,
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
            src={image.thumbnail_url || image.url}
            alt={image.title}
            fill
            className='object-cover transition-transform group-hover:scale-105'
            onError={() => setImageError(true)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-gray-200'>
            <span className='text-gray-500'>Failed to load image</span>
          </div>
        )}

        {/* Overlay Actions */}
        <div className='absolute inset-0 bg-black/0 transition-all group-hover:bg-black/30'>
          <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => onView(image)}
                className='h-8 w-8 p-0'
                title='View full size'
              >
                <Eye className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onClick={handleDownload}
                disabled={isLoading}
                className='h-8 w-8 p-0'
                title='Download'
              >
                <Download className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={() => onDelete(image)}
                className='h-8 w-8 p-0'
                title='Delete'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className='p-4'>
        <div className='space-y-2'>
          {/* Title */}
          <h3 className='font-semibold truncate' title={image.title}>
            {image.title}
          </h3>

          {/* Description */}
          {image.description && (
            <p
              className='text-sm text-gray-600 line-clamp-2'
              title={image.description}
            >
              {image.description}
            </p>
          )}

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

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {image.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className='inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full'
                >
                  {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className='inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
