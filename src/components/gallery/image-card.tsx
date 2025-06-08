"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, Trash2, Eye, ShoppingCart, Crown, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Image as ImageType } from "@/types/image"
import { cn } from "@/lib/utils/cn"
import { formatDistanceToNow } from "date-fns"

interface ImageCardProps {
  image: ImageType
  onView: (image: ImageType) => void
  onViewFullSize: (image: ImageType) => void
  onDelete: (image: ImageType) => void
  onDownload: (image: ImageType) => void
  onCheckout: (image: ImageType) => void
  isPurchased: boolean
  viewMode?: "grid" | "list" | "masonry"
  className?: string
}

export function ImageCard({
  image,
  onView,
  onViewFullSize,
  onDelete,
  onDownload,
  onCheckout,
  isPurchased,
  viewMode = "grid",
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
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

            {isPurchased ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer"
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
            ) : (
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

  // Calculate aspect ratio for different view modes
  const aspectRatio = image.width && image.height ? image.width / image.height : 1
  
  let paddingTop: string
  
  if (viewMode === "grid") {
    // Grid mode: use 4:3 aspect ratio for thumbnails
    // 4:3 = 1.333... so paddingTop = (3/4) * 100% = 75%
    paddingTop = "75%"
  } else if (viewMode === "masonry") {
    // Masonry mode: use original aspect ratios with minimal constraints for extreme cases
    const constrainedAspectRatio = Math.max(0.3, Math.min(4, aspectRatio))
    paddingTop = `${(1 / constrainedAspectRatio) * 100}%`
  } else {
    // List mode: fixed height
    paddingTop = "100%"
  }

  // Determine container style based on view mode
  const containerStyle = (viewMode as string) === "list" 
    ? { height: "200px" } 
    : { paddingTop: paddingTop }

  return (
    <div className={cn("krea-gallery-item group", className)}>
      {/* Image Container */}
      <div 
        className={cn(
          "relative overflow-hidden bg-gray-100",
          viewMode === "grid" ? "rounded-xl" : ""
        )} 
        style={containerStyle}
      >
        {!imageError ? (
          <Image
            src={image.storage_url || "/placeholder.svg"}
            alt={image.original_name}
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-300 cursor-pointer"
            onError={() => setImageError(true)}
            onClick={() => onView(image)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            title="Click to open gallery view"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-gray-500">Failed to load</span>
          </div>
        )}

        {/* Krea.ai style time badge */}
        <div className="krea-time-badge">
          {formatDistanceToNow(new Date(image.created_at), {
            addSuffix: false,
          })}
        </div>

        {/* Purchase status indicator - Enhanced for better distinction */}
        {isPurchased ? (
          <div className="absolute top-2 right-2">
            <div className="krea-badge bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md border border-green-400/30">
              <Crown className="h-3 w-3 mr-1" />
              Owned
            </div>
          </div>
        ) : (
          <div className="absolute top-2 right-2">
            <div className="krea-badge bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md border border-orange-300/30">
              <DollarSign className="h-3 w-3 mr-1" />
              For Sale
            </div>
          </div>
        )}

        {/* Overlay with actions */}
        <div className="krea-image-overlay">
          <div className="krea-action-buttons">
            <button 
              onClick={() => onViewFullSize(image)} 
              className="krea-action-button cursor-pointer"
              title="View large"
            >
              <Eye className="h-4 w-4" />
            </button>

            {isPurchased ? (
              <button 
                onClick={handleDownload} 
                disabled={isLoading} 
                className="krea-action-button cursor-pointer"
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={handleCheckout} 
                className="krea-action-button-primary cursor-pointer"
                title="Purchase this image"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}

            <button 
              onClick={() => onDelete(image)} 
              className="krea-action-button-danger cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Image info on hover - Krea.ai style */}
          <div className="krea-image-info">
            <h3 className="font-medium truncate text-sm">{image.original_name}</h3>
            <div className="flex items-center justify-between text-xs mt-1 text-gray-200">
              <span>{formatFileSize(image.file_size)}</span>
              {image.width && image.height && (
                <span>
                  {image.width}×{image.height}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
