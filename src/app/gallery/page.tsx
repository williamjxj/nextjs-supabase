import type { Metadata } from 'next'
import { ImageGallery } from '@/components/gallery/image-gallery'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata: Metadata = {
  title: 'Gallery | NextJS Supabase Gallery',
  description: 'View and manage your image gallery',
}

function GalleryContent() {
  return (
    <div className='bg-gray-50 min-h-screen'>
      <Suspense
        fallback={
          <div className='flex items-center justify-center py-20'>
            <LoadingSpinner
              size='xl'
              variant='gradient'
              text='Loading gallery content...'
            />
          </div>
        }
      >
        <ImageGallery />
      </Suspense>
    </div>
  )
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className='bg-gray-50 min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <LoadingSpinner
              size='xl'
              variant='gradient'
              text='Loading Gallery...'
            />
          </div>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  )
}
