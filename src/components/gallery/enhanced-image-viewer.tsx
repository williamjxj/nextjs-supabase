'use client'

import { useState, useEffect } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { Image as ImageType } from '@/types/image'

interface EnhancedImageViewerProps {
  images: ImageType[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
}

export function EnhancedImageViewer({
  images,
  currentIndex,
  isOpen,
  onClose,
}: EnhancedImageViewerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !images.length) return null

  // Convert our image types to lightbox slides format
  const slides = images.map((image) => ({
    src: image.storage_url,
    alt: image.original_name,
    width: image.width || 1920,
    height: image.height || 1080,
  }))

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={Math.max(0, Math.min(currentIndex, slides.length - 1))}
      slides={slides}
      plugins={[Zoom, Fullscreen, Thumbnails, Counter]}
      
      // Enhanced zoom configuration for Pixea-like experience
      zoom={{
        maxZoomPixelRatio: 5, // Allow more zoom for detailed viewing
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 3,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      
      // Carousel settings
      carousel={{
        finite: false,
        preload: 2,
        padding: "16px",
        spacing: "30%",
        imageFit: "contain",
      }}
      
      // Animation settings for smooth transitions
      animation={{
        fade: 300,
        swipe: 500,
        easing: {
          fade: "ease-out",
          swipe: "ease-out", 
          navigation: "ease-in-out"
        }
      }}
      
      // Controller settings for enhanced interaction
      controller={{
        focus: true,
        aria: true,
        touchAction: "none",
        closeOnPullUp: true,
        closeOnPullDown: true,
        closeOnBackdropClick: true,
      }}
      
      // Thumbnails configuration for navigation
      thumbnails={{
        position: "bottom",
        width: 100,
        height: 60,
        border: 2,
        borderRadius: 6,
        padding: 4,
        gap: 12,
        imageFit: "cover",
        vignette: true,
      }}
      
      // Counter configuration
      counter={{
        container: { 
          style: { 
            top: "20px",
            bottom: "unset",
            right: "20px",
            left: "unset",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "16px",
            padding: "6px 12px",
            backdropFilter: "blur(8px)",
          } 
        }
      }}
      
      // Custom styles for Pixea-like appearance
      styles={{
        root: {
          "--yarl__color_backdrop": "rgba(0, 0, 0, 0.98)",
        },
        container: {
          backgroundColor: "rgba(0, 0, 0, 0.98)",
        }
      }}
      
      // Toolbar configuration with essential buttons
      toolbar={{
        buttons: ["fullscreen", "close"]
      }}
      
      // Event handlers
      on={{
        view: ({ index }) => {
          // Viewing current image
        },
        click: ({ index }) => {
          // Image clicked
        },
      }}
    />
  )
}
