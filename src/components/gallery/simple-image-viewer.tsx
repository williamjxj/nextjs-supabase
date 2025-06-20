'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Image as ImageType } from '@/types/image'

interface SimpleImageViewerProps {
  image: ImageType | null
  isOpen: boolean
  onClose: () => void
}

export function SimpleImageViewer({
  image,
  isOpen,
  onClose,
}: SimpleImageViewerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, onClose])

  if (!mounted || !image || !isOpen) return null

  return createPortal(
    <div className='fixed inset-0 z-50 bg-black'>
      {/* Header */}
      <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-6 text-white'>
        <h2 className='text-xl font-semibold truncate max-w-[70%]'>
          {image.original_name}
        </h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClose}
          className='text-white hover:bg-white/20 cursor-pointer shrink-0'
          title='Close viewer (ESC)'
        >
          <X className='h-6 w-6' />
        </Button>
      </div>

      {/* Image Container - Full screen with proper aspect ratio */}
      <div
        className='absolute inset-0 flex items-center justify-center cursor-pointer'
        onClick={onClose}
        title='Click to close'
      >
        <div className='relative w-full h-full max-w-[98vw] max-h-[98vh] flex items-center justify-center'>
          <Image
            src={image.storage_url}
            alt={image.original_name}
            fill
            className='object-contain'
            priority
            sizes='98vw'
            style={{
              maxWidth: '98vw',
              maxHeight: '98vh',
            }}
          />
        </div>
      </div>

      {/* Footer with image info */}
      <div className='absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 text-white'>
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-6'>
            {image.width && image.height && (
              <span className='font-medium'>
                {image.width} × {image.height} px
              </span>
            )}
            <span>{(image.file_size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <div className='text-gray-300'>
            Press ESC or click anywhere to close
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
