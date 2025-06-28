'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Navigation, MobileNavigation } from './navigation'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ImageIcon } from 'lucide-react'

export const Header = () => {
  const { user, loading, mounted } = useAuth()

  // Simplified display logic - always show navigation
  const showUserInfo = mounted && !loading && user
  const showLoading = !mounted || loading

  return (
    <header className='sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800'>
      <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center space-x-2 transition-all duration-200 hover:scale-105'
        >
          <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200'>
            <ImageIcon className='w-5 h-5 text-white' />
          </div>
          <span className='font-bold text-xl text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200'>
            Gallery
          </span>
        </Link>

        {/* Desktop Navigation - Always show */}
        <div className='hidden md:flex'>
          <Navigation orientation='horizontal' className='space-x-1' />
        </div>

        {/* User Actions */}
        <div className='flex items-center space-x-3'>
          {showUserInfo ? (
            /* Authenticated user actions */
            <div className='flex items-center space-x-3'>
              <ProfileDropdown />
              <ThemeToggle />
            </div>
          ) : showLoading ? (
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse' />
              <ThemeToggle />
            </div>
          ) : (
            /* Non-authenticated user actions */
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2'>
                <Link href='/login'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-105'
                  >
                    Log In
                  </Button>
                </Link>
                <Link href='/signup'>
                  <Button
                    size='sm'
                    className='bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg'
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
              <ThemeToggle />
            </div>
          )}

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
