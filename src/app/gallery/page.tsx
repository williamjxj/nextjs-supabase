import type { Metadata } from 'next'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Gallery | NextJS Supabase Gallery',
  description: 'View and manage your image gallery',
}

function GalleryContent() {
  return (
    <div className='bg-gray-50 min-h-screen'>
      <ImageGallery />
    </div>
  )
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className='bg-gray-50 min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4' />
            <p className='text-gray-600'>Loading gallery...</p>
          </div>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  )
}
