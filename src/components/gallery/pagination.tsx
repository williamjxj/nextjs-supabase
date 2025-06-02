'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
  hasNext: boolean
  hasPrevious: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  hasNext,
  hasPrevious,
  className,
}: PaginationProps) {
  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2 // Number of pages to show around current page
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <nav
      className={cn('flex items-center justify-center space-x-1', className)}
    >
      {/* Previous Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={onPrevious}
        disabled={!hasPrevious}
        className='flex items-center gap-1'
      >
        <ChevronLeft className='h-4 w-4' />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className='flex items-center space-x-1'>
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className='px-2 py-1'>
                <MoreHorizontal className='h-4 w-4' />
              </span>
            )
          }

          const pageNumber = page as number
          const isCurrentPage = pageNumber === currentPage

          return (
            <Button
              key={pageNumber}
              variant={isCurrentPage ? 'default' : 'outline'}
              size='sm'
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                'min-w-[2.5rem]',
                isCurrentPage && 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {pageNumber}
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={onNext}
        disabled={!hasNext}
        className='flex items-center gap-1'
      >
        Next
        <ChevronRight className='h-4 w-4' />
      </Button>
    </nav>
  )
}
