import React from 'react'
import { cn } from '@/lib/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'gradient' | 'dots' | 'pulse'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'gradient':
        return (
          <div className='relative'>
            <div
              className={cn(
                'animate-spin rounded-full border-4 border-gray-200',
                sizeClasses[size]
              )}
            />
            <div
              className={cn(
                'absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600',
                sizeClasses[size]
              )}
            />
            <div
              className={cn(
                'absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-purple-500',
                sizeClasses[size]
              )}
              style={{
                animationDirection: 'reverse',
                animationDuration: '0.8s',
              }}
            />
          </div>
        )

      case 'dots':
        const dotSize =
          size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'

        return (
          <div className='flex space-x-1'>
            <div
              className={cn('bg-blue-600 rounded-full animate-bounce', dotSize)}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={cn('bg-blue-600 rounded-full animate-bounce', dotSize)}
              style={{ animationDelay: '150ms' }}
            />
            <div
              className={cn('bg-blue-600 rounded-full animate-bounce', dotSize)}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )

      case 'pulse':
        return (
          <div
            className={cn(
              'bg-blue-600 rounded-full animate-pulse',
              sizeClasses[size]
            )}
          />
        )

      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
              sizeClasses[size]
            )}
          />
        )
    }
  }

  return (
    <div
      className={cn('flex flex-col items-center space-y-2', className)}
      role='status'
      aria-label={text || 'Loading'}
    >
      {renderSpinner()}
      {text && (
        <span className='text-sm text-gray-600 animate-pulse'>{text}</span>
      )}
      <span className='sr-only'>{text || 'Loading...'}</span>
    </div>
  )
}
