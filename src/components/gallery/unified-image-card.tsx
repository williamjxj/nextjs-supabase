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
  Loader2,
} from 'lucide-react'
import type { Image as ImageType } from '@/types/image'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/hooks/use-auth'
import { canDownloadImage, ImageAccessResult } from '@/lib/subscription-access'

interface UnifiedImageCardProps {
  image: ImageType
  onView: (image: ImageType) => void
  onViewFullSize: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout: (image: ImageType) => void
  viewMode?: 'grid' | 'list' | 'masonry'
  className?: string
  showActions?: boolean
  showAccessInfo?: boolean
}

interface AccessState extends ImageAccessResult {
  loading: boolean
}

export function UnifiedImageCard({
  image,
  onView,
  onViewFullSize,
  onDelete,
  onDownload,
  onCheckout,
  viewMode = 'grid',
  className,
  showActions = true,
  showAccessInfo = true,
}: UnifiedImageCardProps) {
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

    if (showAccessInfo) {
      checkAccess()
    } else {
      setAccessState(prev => ({ ...prev, loading: false }))
    }
  }, [image.id, user, showAccessInfo])

  const handleDownload = async () => {
    if (!accessState.canDownload) return

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    )
  }

  // Determine access status for UI
  const getAccessStatus = () => {
    if (accessState.loading) {
      return { type: 'loading', label: 'Checking...', icon: Loader2 }
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

  // List view layout
  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'krea-gallery-item group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200',
          className
        )}
      >
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

          {/* Access level badge */}
          {showAccessInfo && (
            <div
              className={cn(
                'absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1',
                accessStatus.type === 'subscription' &&
                  'bg-purple-500 text-white',
                accessStatus.type === 'purchased' && 'bg-green-500 text-white',
                accessStatus.type === 'purchase' && 'bg-orange-500 text-white',
                accessStatus.type === 'login' && 'bg-gray-500 text-white',
                accessStatus.type === 'limited' && 'bg-red-500 text-white',
                accessStatus.type === 'loading' && 'bg-blue-500 text-white'
              )}
            >
              {accessStatus.icon && (
                <accessStatus.icon
                  className={cn(
                    'h-3 w-3',
                    accessStatus.type === 'loading' && 'animate-spin'
                  )}
                />
              )}
            </div>
          )}
        </div>

        {/* Image info */}
        <div className='flex-1 min-w-0'>
          <h3 className='font-medium truncate text-sm text-gray-900'>
            {image.original_name}
          </h3>
          <div className='flex items-center justify-between text-xs mt-1 text-gray-500'>
            <span>{formatFileSize(image.file_size)}</span>
            <span>
              {image.width}×{image.height}
            </span>
          </div>
          {showAccessInfo && !accessState.loading && (
            <div className='text-xs mt-1'>
              {accessState.canDownload ? (
                <span className='text-green-600'>
                  {accessState.accessType === 'subscription'
                    ? accessState.downloadsRemaining !== undefined
                      ? `${accessState.downloadsRemaining} downloads left`
                      : 'Unlimited downloads'
                    : 'Purchased'}
                </span>
              ) : (
                <span className='text-orange-600'>
                  {accessState.reason || 'Purchase required'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className='flex items-center gap-2'>
            <button
              onClick={() => onView(image)}
              className='p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors'
              title='View image'
            >
              <Eye className='h-4 w-4' />
            </button>

            {accessState.canDownload ? (
              <button
                onClick={handleDownload}
                disabled={isLoading || accessState.loading}
                className='p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors disabled:opacity-50'
                title='Download image'
              >
                <Download className='h-4 w-4' />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className='p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors'
                title='Purchase image'
              >
                <ShoppingCart className='h-4 w-4' />
              </button>
            )}

            <button
              onClick={() => onDelete(image)}
              className='p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors'
              title='Delete image'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Grid/Masonry view layout continues in next part...
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

        {/* Access status indicator */}
        {showAccessInfo && (
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
                <accessStatus.icon
                  className={cn(
                    'h-3 w-3 mr-1',
                    accessStatus.type === 'loading' && 'animate-spin'
                  )}
                />
              )}
              <span className='text-xs font-medium'>{accessStatus.label}</span>
            </div>
          </div>
        )}

        {/* Action buttons overlay */}
        {showActions && (
          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100'>
            <div className='flex gap-2'>
              <button
                onClick={() => onViewFullSize(image)}
                className='krea-action-button cursor-pointer'
                title='View full size'
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
          </div>
        )}

        {/* Image info overlay */}
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
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
            {showAccessInfo && !accessState.loading && (
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
