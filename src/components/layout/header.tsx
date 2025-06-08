'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { Home, Upload, ImageIcon, User, Crown, Menu, X } from 'lucide-react'
import { useState } from 'react'

export const Header = () => {
  const { user, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'>
      <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <ImageIcon className='w-5 h-5 text-white' />
          </div>
          <span className='font-bold text-xl text-gray-900'>Gallery</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center space-x-1'>
          <Link href='/'>
            <button className='flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
              <Home className='w-4 h-4' />
              <span className='text-sm font-medium'>Home</span>
            </button>
          </Link>

          {user && (
            <>
              <Link href='/gallery'>
                <button className='flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                  <ImageIcon className='w-4 h-4' />
                  <span className='text-sm font-medium'>Gallery</span>
                </button>
              </Link>

              <Link href='/upload'>
                <button className='flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                  <Upload className='w-4 h-4' />
                  <span className='text-sm font-medium'>Upload</span>
                </button>
              </Link>

              <Link href='/pricing'>
                <button className='flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                  <Crown className='w-4 h-4' />
                  <span className='text-sm font-medium'>Pricing</span>
                </button>
              </Link>
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className='flex items-center space-x-3'>
          {loading ? (
            <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
          ) : user ? (
            <div className='flex items-center space-x-3'>
              <div className='hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full'>
                <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                  <User className='w-3 h-3 text-white' />
                </div>
                <span className='text-sm text-gray-700 font-medium'>
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <LogoutButton
                variant='ghost'
                size='sm'
                className='text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full'
              />
            </div>
          ) : (
            <div className='flex items-center space-x-2'>
              <Link href='/login'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full'
                >
                  Log In
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm' className='krea-button-primary'>
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden p-2 rounded-full hover:bg-gray-50 hover:cursor-pointer transition-colors'
          >
            {mobileMenuOpen ? (
              <X className='w-5 h-5 text-gray-600' />
            ) : (
              <Menu className='w-5 h-5 text-gray-600' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className='md:hidden bg-white border-t border-gray-100'>
          <div className='px-6 py-4 space-y-2'>
            <Link href='/'>
              <button className='flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                <Home className='w-5 h-5' />
                <span className='font-medium'>Home</span>
              </button>
            </Link>

            {user && (
              <>
                <Link href='/gallery'>
                  <button className='flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                    <ImageIcon className='w-5 h-5' />
                    <span className='font-medium'>Gallery</span>
                  </button>
                </Link>

                <Link href='/upload'>
                  <button className='flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                    <Upload className='w-5 h-5' />
                    <span className='font-medium'>Upload</span>
                  </button>
                </Link>

                <Link href='/pricing'>
                  <button className='flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:cursor-pointer transition-all duration-200'>
                    <Crown className='w-5 h-5' />
                    <span className='font-medium'>Pricing</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
