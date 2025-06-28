'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/hooks/use-auth'

interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  requireAuth?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      >
        <path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
        <polyline points='9,22 9,12 15,12 15,22' />
      </svg>
    ),
  },
  {
    label: 'Gallery',
    href: '/gallery',
    requireAuth: true,
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      >
        <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
        <circle cx='9' cy='9' r='2' />
        <path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' />
      </svg>
    ),
  },
  {
    label: 'Upload',
    href: '/upload',
    requireAuth: true,
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      >
        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
        <polyline points='7,10 12,15 17,10' />
        <line x1='12' y1='15' x2='12' y2='3' />
      </svg>
    ),
  },
  {
    label: 'Membership',
    href: '/membership',
    requireAuth: true,
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      >
        <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
        <circle cx='8.5' cy='7' r='4'></circle>
        <polyline points='17 11 19 13 23 9'></polyline>
      </svg>
    ),
  },
]

interface NavigationProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showIcons?: boolean
}

export const Navigation = ({
  className,
  orientation = 'horizontal',
  showIcons = true,
}: NavigationProps) => {
  const pathname = usePathname()
  const { user, loading, mounted } = useAuth()

  // Show all items when user is authenticated, or only public items when not
  // Never hide the navigation completely - this prevents flickering
  const isAuthenticated = mounted && !loading && user
  const isInitializing = !mounted || loading

  // Filter items based on authentication state
  const filteredItems = React.useMemo(() => {
    return navigationItems.filter(item => {
      if (!item.requireAuth) {
        return true // Always show non-auth items like Home, Membership
      }
      // For auth-required items, only show them if authenticated
      return isAuthenticated
    })
  }, [isAuthenticated])

  const containerClasses = cn(
    'flex',
    orientation === 'horizontal' ? 'flex-row space-x-1' : 'flex-col space-y-1',
    className
  )

  return (
    <nav className={containerClasses}>
      {filteredItems.map(item => {
        const isActive = pathname === item.href

        // For auth-required items, disable them if user is not authenticated
        const isDisabled = item.requireAuth && !isAuthenticated
        const showAsLoading = item.requireAuth && isInitializing

        return (
          <Link
            key={`nav-${item.href}`}
            href={isDisabled ? '#' : item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              showAsLoading && 'animate-pulse bg-gray-100 text-gray-400',
              !isDisabled &&
                !showAsLoading &&
                'hover:bg-gray-50 hover:text-gray-900 hover:cursor-pointer hover:scale-105',
              isActive && !isDisabled && !showAsLoading
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : isDisabled && !showAsLoading
                  ? 'text-gray-400 cursor-not-allowed opacity-60'
                  : !showAsLoading && 'text-gray-600',
              orientation === 'vertical' &&
                'justify-start w-full rounded-xl px-4 py-3'
            )}
            onClick={isDisabled ? e => e.preventDefault() : undefined}
          >
            {showIcons && item.icon && (
              <span className='flex-shrink-0'>{item.icon}</span>
            )}
            <span>{showAsLoading ? '...' : item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile Navigation with hamburger menu
export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, mounted } = useAuth()

  // Show all items, let Navigation component handle auth states
  const filteredItems = navigationItems

  return (
    <div className='md:hidden relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800 hover:cursor-pointer hover:scale-110',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-label='Toggle navigation menu'
      >
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          {isOpen ? (
            <>
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </>
          ) : (
            <>
              <line x1='3' y1='6' x2='21' y2='6'></line>
              <line x1='3' y1='12' x2='21' y2='12'></line>
              <line x1='3' y1='18' x2='21' y2='18'></line>
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <div className='absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 min-w-48 z-50 animate-in slide-in-from-top-2 duration-200'>
          <Navigation orientation='vertical' className='space-y-1' />
        </div>
      )}
    </div>
  )
}
