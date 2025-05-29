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
  const { user } = useAuth()

  const filteredItems = navigationItems.filter(
    item => !item.requireAuth || (item.requireAuth && user)
  )

  const containerClasses = cn(
    'flex',
    orientation === 'horizontal' ? 'flex-row space-x-1' : 'flex-col space-y-1',
    className
  )

  return (
    <nav className={containerClasses}>
      {filteredItems.map(item => {
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
              orientation === 'vertical' && 'justify-start w-full'
            )}
          >
            {showIcons && item.icon && (
              <span className='flex-shrink-0'>{item.icon}</span>
            )}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile Navigation with hamburger menu
export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const filteredItems = navigationItems.filter(
    item => !item.requireAuth || (item.requireAuth && user)
  )

  return (
    <div className='md:hidden relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='p-2 rounded-md hover:bg-accent'
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
        <div className='absolute top-12 right-0 bg-background border rounded-lg shadow-lg p-4 min-w-48 z-50'>
          <Navigation orientation='vertical' className='space-y-2' />
        </div>
      )}
    </div>
  )
}
