'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  className?: string
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    // Ensure value is between 0 and max
    const normalizedValue = Math.min(Math.max(value, 0), max)
    const percentage = (normalizedValue / max) * 100

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out',
            indicatorClassName
          )}
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }
