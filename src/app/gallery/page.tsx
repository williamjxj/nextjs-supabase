import { Metadata } from 'next'
import { ImageGallery } from '@/components/gallery/image-gallery'

export const metadata: Metadata = {
  title: 'Gallery | NextJS Supabase Gallery',
  description: 'View and manage your image gallery',
}

export default function GalleryPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <ImageGallery />
    </div>
  )
}
