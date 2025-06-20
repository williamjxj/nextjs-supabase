'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Download,
  Trash2,
  Eye,
  ShoppingCart,
  Crown,
  Lock,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { canDownloadImage, ImageAccessResult } from '@/lib/subscription-access'

interface EnhancedImageCardProps {
  image: ImageType
  onView: (image: ImageType) => void
  onViewFullSize: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout: (image: ImageType) => void
  viewMode?: 'grid' | 'list' | 'masonry'
  className?: string
}

// Use the unified access result interface
interface AccessState extends ImageAccessResult {
  loading: boolean
}

export function EnhancedImageCard({
  image,
  onView,
  onViewFullSize,
  onDelete,
  onDownload,
  onCheckout,
  viewMode = 'grid',
  className,
}: EnhancedImageCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [accessState, setAccessState] = useState<AccessState>({
    canDownload: false,
    canView: true,
    accessType: 'blocked',
    loading: true,
  })

  const { user } = useAuth()

  // Check access permissions when component mounts or user changes
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccessState({
          canDownload: false,
          canView: true,
          reason: 'Please log in to download images',
          requiresPayment: false,
          accessType: 'blocked',
          loading: false,
        })
        return
      }

      try {
        const result = await canDownloadImage(image.id)
        setAccessState({
          ...result,
          loading: false,
        })
      } catch (error) {
        console.error('Error checking image access:', error)
        setAccessState({
          canDownload: false,
          canView: true,
          reason: 'Error checking access permissions',
          requiresPayment: false,
          accessType: 'blocked',
          loading: false,
        })
      }
    }

    checkAccess()
  }, [image.id, user])

  const handleDownload = async () => {
    if (!accessState.canDownload) {
      return
    }

    setIsLoading(true)
    try {
      onDownload(image)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      onCheckout(image)
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

  // Determine access status for UI based on new access types
  const getAccessStatus = () => {
    if (accessState.loading) {
      return { type: 'loading', label: 'Checking...', icon: null }
    }

    if (!user) {
      return { type: 'login', label: 'Login Required', icon: Lock }
    }

    switch (accessState.accessType) {
      case 'subscription':
        return {
          type: 'subscription',
          label:
            accessState.downloadsRemaining !== undefined
              ? `${accessState.downloadsRemaining} downloads left`
              : 'Subscription Access',
          icon: Crown,
        }
      case 'purchased':
        return { type: 'purchased', label: 'Purchased', icon: CheckCircle }
      case 'free':
        return {
          type: 'purchase',
          label: 'Purchase Required',
          icon: ShoppingCart,
        }
      case 'blocked':
      default:
        return { type: 'limited', label: 'Limited Access', icon: Lock }
    }
  }

  const accessStatus = getAccessStatus()

  // Calculate aspect ratio for different view modes
  const aspectRatio =
    image.width && image.height ? image.width / image.height : 1

  let paddingTop: string

  if (viewMode === 'grid') {
    paddingTop = '75%' // 4:3 aspect ratio
  } else if (viewMode === 'masonry') {
    const constrainedAspectRatio = Math.max(0.3, Math.min(4, aspectRatio))
    paddingTop = `${(1 / constrainedAspectRatio) * 100}%`
  } else {
    paddingTop = '100%'
  }

  const containerStyle =
    viewMode === 'list' ? { height: '200px' } : { paddingTop: paddingTop }

  return (
    <div className={cn('krea-gallery-item group', className)}>
      {/* Image Container */}
      <div
        className={cn(
          'relative overflow-hidden bg-gray-100',
          viewMode === 'grid' ? 'rounded-xl' : ''
        )}
        style={containerStyle}
      >
        {!imageError ? (
          <Image
            src={image.storage_url || '/placeholder.svg'}
            alt={image.original_name}
            fill
            className='object-cover transition-transform group-hover:scale-105 duration-300 cursor-pointer'
            onError={() => setImageError(true)}
            onClick={() => onView(image)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            loading='lazy'
            title='Click to open gallery view'
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-gray-200'>
            <span className='text-gray-500'>Failed to load</span>
          </div>
        )}

        {/* Time badge */}
        <div className='krea-time-badge'>
          {formatDistanceToNow(new Date(image.created_at), {
            addSuffix: false,
          })}
        </div>

        {/* Enhanced access status indicator */}
        <div className='absolute top-2 right-2'>
          <div
            className={cn(
              'krea-badge shadow-md border',
              accessStatus.type === 'subscription' &&
                'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400/30',
              accessStatus.type === 'purchased' &&
                'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/30',
              accessStatus.type === 'purchase' &&
                'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-orange-300/30',
              accessStatus.type === 'login' &&
                'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300/30',
              accessStatus.type === 'limited' &&
                'bg-gradient-to-r from-red-400 to-red-500 text-white border-red-300/30',
              accessStatus.type === 'loading' &&
                'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-300/30'
            )}
          >
            {accessStatus.icon && (
              <accessStatus.icon className='h-3 w-3 mr-1' />
            )}
            {accessStatus.label}
          </div>
        </div>

        {/* Overlay with actions */}
        <div className='krea-image-overlay'>
          <div className='krea-action-buttons'>
            <button
              onClick={() => onViewFullSize(image)}
              className='krea-action-button cursor-pointer'
              title='View large'
            >
              <Eye className='h-4 w-4' />
            </button>

            {accessState.canDownload ? (
              <button
                onClick={handleDownload}
                disabled={isLoading || accessState.loading}
                className='krea-action-button cursor-pointer'
                title={
                  user?.hasActiveSubscription
                    ? 'Download with subscription'
                    : 'Download purchased image'
                }
              >
                <Download className='h-4 w-4' />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className='krea-action-button-primary cursor-pointer'
                title={accessState.reason || 'Purchase this image'}
              >
                <ShoppingCart className='h-4 w-4' />
              </button>
            )}

            <button
              onClick={() => onDelete(image)}
              className='krea-action-button-danger cursor-pointer'
              title='Delete image'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>

          {/* Enhanced image info */}
          <div className='krea-image-info'>
            <h3 className='font-medium truncate text-sm'>
              {image.original_name}
            </h3>
            <div className='flex items-center justify-between text-xs mt-1 text-gray-200'>
              <span>{formatFileSize(image.file_size)}</span>
              <span>
                {image.width}×{image.height}
              </span>
            </div>
            {/* Enhanced access status in overlay */}
            {!accessState.loading && (
              <div className='text-xs mt-1 opacity-75'>
                {accessState.canDownload ? (
                  <div className='flex items-center gap-1'>
                    <span className='text-green-300'>✓</span>
                    <span className='text-green-300'>
                      {accessState.accessType === 'subscription'
                        ? accessState.downloadsRemaining !== undefined
                          ? `${accessState.downloadsRemaining} left`
                          : 'Unlimited'
                        : 'Purchased'}
                    </span>
                  </div>
                ) : (
                  <span className='text-orange-300'>
                    {accessState.reason || 'Purchase required'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
