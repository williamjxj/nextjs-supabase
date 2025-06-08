"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, Trash2, Eye, ShoppingCart, Crown, DollarSign, Lock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Image as ImageType } from "@/types/image"
import { cn } from "@/lib/utils/cn"
import { formatDistanceToNow } from "date-fns"
import type { SubscriptionAccess } from "@/lib/subscription-access"
import Link from "next/link"

interface ImageCardWithSubscriptionProps {
  image: ImageType
  onView: (image: ImageType) => void
  onViewFullSize: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout?: (image: ImageType) => void
  subscriptionAccess: SubscriptionAccess
  viewMode?: "grid" | "list" | "masonry"
  className?: string
}

function ImageCardWithSubscription({
  image,
  onView,
  onViewFullSize,
  onDelete,
  onDownload,
  onCheckout,
  subscriptionAccess,
  viewMode = "grid",
  className,
}: ImageCardWithSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const canDownloadImage = subscriptionAccess.canDownload
  const accessLevel = subscriptionAccess.accessLevel
  const downloadsRemaining = subscriptionAccess.downloadsRemaining

  const handleDownload = async () => {
    if (!canDownloadImage) {
      // Redirect to subscription page
      return
    }

    setIsLoading(true)
    try {
      await onDownload(image)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (onCheckout) {
      setIsLoading(true)
      try {
        await onCheckout(image)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getAccessLevelIcon = () => {
    switch (accessLevel) {
      case 'free':
        return <Eye className="h-3 w-3" />
      case 'basic':
        return <Star className="h-3 w-3" />
      case 'pro':
        return <Crown className="h-3 w-3" />
      case 'enterprise':
        return <Crown className="h-3 w-3 text-purple-500" />
      default:
        return null
    }
  }

  const getAccessLevelColor = () => {
    switch (accessLevel) {
      case 'free':
        return 'text-gray-500 bg-gray-100'
      case 'basic':
        return 'text-blue-600 bg-blue-100'
      case 'pro':
        return 'text-green-600 bg-green-100'
      case 'enterprise':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  const renderDownloadButton = () => {
    if (!canDownloadImage) {
      return (
        <Link href="/account">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-full text-xs cursor-pointer"
            title="Subscribe to download"
          >
            <Lock className="h-3 w-3 mr-1" />
            Subscribe
          </Button>
        </Link>
      )
    }

    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownload}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer"
        title={`Download image${downloadsRemaining ? ` (${downloadsRemaining} remaining)` : ''}`}
      >
        <Download className="h-4 w-4" />
      </Button>
    )
  }

  if (viewMode === "list") {
    return (
      <div className={cn("krea-card p-4 hover:shadow-md transition-all duration-200", className)}>
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {!imageError ? (
              <Image
                src={image.storage_url || "/placeholder.svg"}
                alt={image.original_name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="64px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-gray-400 text-xs">Error</span>
              </div>
            )}
            
            {/* Access level badge */}
            <div className={cn(
              "absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1",
              getAccessLevelColor()
            )}>
              {getAccessLevelIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate mb-1">{image.original_name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
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
            
            {/* Subscription status */}
            {accessLevel !== 'free' && (
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium capitalize",
                  getAccessLevelColor()
                )}>
                  {accessLevel} Plan
                </span>
                {downloadsRemaining !== undefined && (
                  <span className="text-xs text-gray-500">
                    {downloadsRemaining} downloads left
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewFullSize(image)}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full cursor-pointer"
              title="View large"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {renderDownloadButton()}

            {/* Legacy purchase button for one-time purchases (if onCheckout is provided) */}
            {onCheckout && !subscriptionAccess.hasActiveSubscription && (
              <Button
                size="sm"
                onClick={handleCheckout}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs cursor-pointer"
                title="Purchase this image"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(image)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-full cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className={cn("krea-card group hover:shadow-lg transition-all duration-200 relative", className)}>
      {/* Access level badge */}
      <div className={cn(
        "absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
        getAccessLevelColor()
      )}>
        {getAccessLevelIcon()}
        <span className="capitalize">{accessLevel}</span>
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {!imageError ? (
          <Image
            src={image.storage_url || "/placeholder.svg"}
            alt={image.original_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-gray-400">Error loading image</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewFullSize(image)}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
            title="View large"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {canDownloadImage ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              disabled={isLoading}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
              title={`Download${downloadsRemaining ? ` (${downloadsRemaining} left)` : ''}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/account">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full text-xs"
                title="Subscribe to download"
              >
                <Lock className="h-3 w-3 mr-1" />
                Subscribe
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-2">{image.original_name}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{formatFileSize(image.file_size)}</span>
          {image.width && image.height && (
            <span>{image.width} × {image.height}</span>
          )}
        </div>
        
        {/* Subscription info */}
        {accessLevel !== 'free' && downloadsRemaining !== undefined && (
          <div className="text-xs text-gray-500 mb-2">
            {downloadsRemaining} downloads remaining this month
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
          </span>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(image)}
            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete image"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { ImageCardWithSubscription }
