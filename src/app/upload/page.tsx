import { ImageUploader } from '@/components/upload/image-uploader'

export default function UploadPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-6 py-8'>
        {/* Header - Krea.ai style */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Upload Images</h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Add new images to your gallery. Drag and drop or click to select files. 
            Support for JPG, PNG, and WebP formats up to 10MB each.
          </p>
        </div>

        <ImageUploader />
      </div>
    </div>
  )
}
