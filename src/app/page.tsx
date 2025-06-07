import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Upload,
  ImageIcon,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Play,
} from 'lucide-react'

export default function Home() {
  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 grid-pattern opacity-30'></div>
        <div className='container mx-auto px-6 py-20'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto'>
            {/* Left Hero Card - Upload Feature */}
            <div className='krea-hero-card relative group'>
              <div className='aspect-[4/3] bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-8 flex flex-col justify-end text-white'>
                <div className='absolute inset-0 bg-black/20'></div>
                <div className='relative z-10'>
                  <div className='inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-4'>
                    <Sparkles className='w-3 h-3' />
                    <span>CORE FEATURE</span>
                  </div>
                  <h2 className='text-3xl font-bold mb-3'>Upload & Organize</h2>
                  <p className='text-white/90 mb-6 text-lg'>
                    Seamlessly upload and manage your image collection with our
                    intuitive gallery system.
                  </p>
                  <Link href='/upload'>
                    <Button className='bg-white text-gray-900 hover:bg-gray-100 rounded-full px-6 py-2.5 font-medium'>
                      Start Uploading
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Hero Card - Gallery Feature */}
            <div className='krea-hero-card relative group'>
              <div className='aspect-[4/3] krea-gradient-purple p-8 flex flex-col justify-end text-white'>
                <div className='absolute inset-0 bg-black/10'></div>
                <div className='relative z-10'>
                  <div className='inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-4'>
                    <Zap className='w-3 h-3' />
                    <span>NEW FEATURE</span>
                  </div>
                  <h2 className='text-3xl font-bold mb-3'>Smart Gallery</h2>
                  <p className='text-white/90 mb-6 text-lg'>
                    Advanced filtering, search, and organization tools to manage
                    your growing collection.
                  </p>
                  <Link href='/gallery'>
                    <Button className='bg-white text-gray-900 hover:bg-gray-100 rounded-full px-6 py-2.5 font-medium'>
                      Explore Gallery
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20'>
        <div className='container mx-auto px-6'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-900 mb-4'>
              Everything you need
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Powerful tools to manage, organize, and share your image
              collection with ease.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
            {/* Feature Card 1 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <Upload className='w-6 h-6 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Easy Upload
              </h3>
              <p className='text-gray-600 mb-4'>
                Drag and drop or click to upload multiple images with support
                for all major formats.
              </p>
              <button className='text-blue-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Learn more</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>

            {/* Feature Card 2 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <ImageIcon className='w-6 h-6 text-purple-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Smart Gallery
              </h3>
              <p className='text-gray-600 mb-4'>
                Beautiful grid layout with advanced filtering, search, and
                sorting capabilities.
              </p>
              <button className='text-purple-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Learn more</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>

            {/* Feature Card 3 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <Shield className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Secure Storage
              </h3>
              <p className='text-gray-600 mb-4'>
                Your images are safely stored with enterprise-grade security and
                backup systems.
              </p>
              <button className='text-green-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Learn more</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>

            {/* Feature Card 4 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <Sparkles className='w-6 h-6 text-orange-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                AI Enhancement
              </h3>
              <p className='text-gray-600 mb-4'>
                Automatic tagging, smart categorization, and intelligent search
                powered by AI.
              </p>
              <button className='text-orange-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Coming soon</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>

            {/* Feature Card 5 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <Zap className='w-6 h-6 text-pink-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Fast Performance
              </h3>
              <p className='text-gray-600 mb-4'>
                Lightning-fast loading with optimized thumbnails and progressive
                image loading.
              </p>
              <button className='text-pink-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Learn more</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>

            {/* Feature Card 6 */}
            <div className='krea-tool-card group'>
              <div className='w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200'>
                <Play className='w-6 h-6 text-indigo-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Media Support
              </h3>
              <p className='text-gray-600 mb-4'>
                Support for images, videos, and other media formats with preview
                capabilities.
              </p>
              <button className='text-indigo-600 font-medium text-sm flex items-center space-x-1 hover:space-x-2 transition-all duration-200'>
                <span>Coming soon</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-white'>
        <div className='container mx-auto px-6'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-4xl font-bold text-gray-900 mb-6'>
              Ready to organize your images?
            </h2>
            <p className='text-xl text-gray-600 mb-10'>
              Join thousands of users who trust our platform to store and
              organize their precious memories.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/signup'>
                <Button
                  size='lg'
                  className='krea-button-primary text-lg px-8 py-4'
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href='/gallery'>
                <Button
                  variant='outline'
                  size='lg'
                  className='krea-button text-lg px-8 py-4'
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
