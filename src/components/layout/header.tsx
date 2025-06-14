'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { UserInfoTooltip } from '@/components/ui/user-info-tooltip'
import { Navigation, MobileNavigation } from './navigation'
import { ImageIcon, User } from 'lucide-react'

export const Header = () => {
  const { user, loading, mounted } = useAuth()

  // Simplified logic: show auth buttons when no user, show user info when user exists
  // Show auth buttons immediately when mounted and no user (even during loading)
  const showAuthButtons = !user && mounted
  const showUserInfo = Boolean(user && mounted)
  const showLoading = mounted && loading && !user

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
        <div className='hidden md:flex'>
          <Navigation orientation='horizontal' className='space-x-1' />
        </div>

        {/* User Actions */}
        <div className='flex items-center space-x-3'>
          {showUserInfo ? (
            <div className='flex items-center space-x-3'>
              <UserInfoTooltip placement='bottom'>
                <div className='hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full cursor-help'>
                  <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                    <User className='w-3 h-3 text-white' />
                  </div>
                  <span className='text-sm text-gray-700 font-medium'>
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              </UserInfoTooltip>
              <LogoutButton
                variant='ghost'
                size='sm'
                className='text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full'
              />
            </div>
          ) : showLoading ? (
            <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
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

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
