'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { UserInfoTooltip } from '@/components/ui/user-info-tooltip'
import { Navigation, MobileNavigation } from './navigation'
import { ImageIcon, User, LogOut } from 'lucide-react'

export const Header = () => {
  const { user, loading, mounted } = useAuth()

  // Simplified display logic - always show navigation
  const showAuthButtons = mounted && !loading && !user
  const showUserInfo = mounted && !loading && user
  const showLoading = !mounted || loading

  return (
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'>
      <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center space-x-2 transition-all duration-200 hover:scale-105'
        >
          <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200'>
            <ImageIcon className='w-5 h-5 text-white' />
          </div>
          <span className='font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors duration-200'>
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
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <UserInfoTooltip placement='bottom'>
                  <div className='hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full cursor-help transition-all duration-200 hover:bg-gray-100 hover:shadow-md hover:scale-105'>
                    <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm'>
                      <User className='w-3 h-3 text-white' />
                    </div>
                    <span className='text-sm text-gray-700 font-medium'>
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                </UserInfoTooltip>
              </div>
              <LogoutButton
                variant='ghost'
                size='sm'
                className='text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200 hover:scale-105'
              >
                <div className='flex items-center gap-2'>
                  <LogOut className='w-4 h-4' />
                  <span className='hidden sm:inline'>Sign out</span>
                </div>
              </LogoutButton>
            </div>
          ) : showLoading ? (
            <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
          ) : (
            <div className='flex items-center space-x-2'>
              <Link href='/login'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200 hover:scale-105'
                >
                  Log In
                </Button>
              </Link>
              <Link href='/signup'>
                <Button
                  size='sm'
                  className='krea-button-primary transition-all duration-200 hover:scale-105 hover:shadow-lg'
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
