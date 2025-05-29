import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Home() {
  return (
    <main className='min-h-screen'>
      {/* Hero Section */}
      <section className='container mx-auto px-4 py-16 text-center'>
        <div className='max-w-3xl mx-auto'>
          <h1 className='text-4xl md:text-6xl font-bold mb-6'>
            Your Personal <span className='text-primary'>Image Gallery</span>
          </h1>
          <p className='text-xl text-muted-foreground mb-8'>
            Upload, organize, and share your photos with our secure, modern
            gallery application powered by Next.js and Supabase.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/signup'>
              <Button size='lg' className='w-full sm:w-auto'>
                Get Started
              </Button>
            </Link>
            <Link href='/gallery'>
              <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='container mx-auto px-4 py-16'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold mb-4'>Features</h2>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            Everything you need to manage your image collection in one place.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='7,10 12,15 17,10' />
                  <line x1='12' y1='15' x2='12' y2='3' />
                </svg>
              </div>
              <CardTitle>Easy Upload</CardTitle>
              <CardDescription>
                Drag and drop or click to upload your images with support for
                multiple formats.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                  <circle cx='9' cy='9' r='2' />
                  <path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' />
                </svg>
              </div>
              <CardTitle>Gallery View</CardTitle>
              <CardDescription>
                Beautiful grid layout to showcase your images with thumbnail
                previews.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <path d='M9 12l2 2 4-4' />
                  <path d='M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1' />
                  <path d='M3 12c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18c.552 0 1-.448 1-1v-6c0-.552-.448-1-1-1' />
                </svg>
              </div>
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                Your images are safely stored with Supabase's secure cloud
                infrastructure.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                  <circle cx='9' cy='7' r='4' />
                  <path d='m19 8 2 2-2 2' />
                  <path d='m17 12h6' />
                </svg>
              </div>
              <CardTitle>User Authentication</CardTitle>
              <CardDescription>
                Secure login system to keep your images private and organized.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
                  <polyline points='7.5,4.21 12,6.81 16.5,4.21' />
                  <polyline points='7.5,19.79 7.5,14.6 3,12' />
                  <polyline points='21,12 16.5,14.6 16.5,19.79' />
                </svg>
              </div>
              <CardTitle>Modern Stack</CardTitle>
              <CardDescription>
                Built with Next.js, TypeScript, and Tailwind CSS for optimal
                performance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  className='text-primary'
                >
                  <polyline points='22,12 18,12 15,21 9,3 6,12 2,12' />
                </svg>
              </div>
              <CardTitle>Fast & Responsive</CardTitle>
              <CardDescription>
                Lightning-fast loading times with responsive design for all
                devices.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className='container mx-auto px-4 py-16'>
        <div className='bg-primary/5 rounded-2xl p-8 md:p-12 text-center'>
          <h2 className='text-3xl font-bold mb-4'>Ready to get started?</h2>
          <p className='text-muted-foreground mb-8 max-w-2xl mx-auto'>
            Join thousands of users who trust our platform to store and organize
            their precious memories.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/signup'>
              <Button size='lg' className='w-full sm:w-auto'>
                Create Account
              </Button>
            </Link>
            <Link href='/login'>
              <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
