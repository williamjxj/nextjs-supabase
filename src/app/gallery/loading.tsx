export default function GalleryLoading() {
  return (
    <div className='bg-gray-50 min-h-screen'>
      {/* Header placeholder */}
      <div className='bg-white border-b border-gray-200 p-6'>
        <div className='container mx-auto'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-8 h-8 bg-gray-200 rounded animate-pulse' />
              <div className='w-24 h-6 bg-gray-200 rounded animate-pulse' />
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-20 h-8 bg-gray-200 rounded animate-pulse' />
              <div className='w-24 h-8 bg-gray-200 rounded animate-pulse' />
            </div>
          </div>
        </div>
      </div>

      {/* Main loading content */}
      <div className='container mx-auto px-6 py-8'>
        {/* Filters placeholder */}
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-32 h-10 bg-gray-200 rounded animate-pulse' />
            <div className='w-24 h-10 bg-gray-200 rounded animate-pulse' />
            <div className='w-20 h-10 bg-gray-200 rounded animate-pulse' />
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gray-200 rounded animate-pulse' />
            <div className='w-8 h-8 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>

        {/* Loading spinner and text */}
        <div className='flex items-center justify-center py-20'>
          <div className='text-center'>
            {/* Enhanced loading spinner */}
            <div className='relative w-16 h-16 mx-auto mb-6'>
              <div className='absolute inset-0 border-4 border-gray-200 rounded-full'></div>
              <div className='absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin'></div>
              <div className='absolute inset-2 border-2 border-transparent border-t-purple-500 rounded-full animate-spin animate-reverse'></div>
            </div>

            {/* Loading text with animation */}
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Loading Gallery
              </h3>
              <div className='flex items-center justify-center space-x-1'>
                <span className='text-gray-600'>Loading your images</span>
                <div className='flex space-x-1'>
                  <div
                    className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery grid placeholder */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-lg shadow-sm overflow-hidden animate-pulse'
            >
              <div className='w-full h-48 bg-gray-200'></div>
              <div className='p-4 space-y-2'>
                <div className='w-3/4 h-4 bg-gray-200 rounded'></div>
                <div className='w-1/2 h-3 bg-gray-200 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
