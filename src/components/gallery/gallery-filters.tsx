'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  SortAsc,
  SortDesc,
  ShoppingCart,
  Check,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

export interface GalleryFilters {
  search: string
  sortBy: 'created_at' | 'original_name' | 'file_size'
  sortOrder: 'asc' | 'desc'
  tags: string[]
  ownership?: 'owned' | 'for-sale' | null
  dateRange?: {
    start: string
    end: string
  }
}

interface GalleryFiltersProps {
  filters: GalleryFilters
  availableTags: string[]
  onFiltersChange: (filters: GalleryFilters) => void
  hasActiveSubscription?: boolean
  className?: string
}

export function GalleryFilters({
  filters,
  availableTags,
  onFiltersChange,
  hasActiveSubscription = false,
  className,
}: GalleryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue })
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchValue, filters, onFiltersChange])

  // Update local search value when filters change from outside
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const updateFilters = (updates: Partial<GalleryFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value) // Update local state immediately for UI responsiveness
  }

  const handleSortChange = (sortBy: GalleryFilters['sortBy']) => {
    // For created_at, always default to desc (latest first) unless explicitly toggling
    // For other fields, toggle between asc and desc
    let sortOrder: 'asc' | 'desc' = 'desc'

    if (sortBy === 'created_at') {
      // For date, default to desc (latest first), only toggle if already selected
      sortOrder =
        filters.sortBy === sortBy && filters.sortOrder === 'desc'
          ? 'asc'
          : 'desc'
    } else {
      // For name and size, toggle between asc and desc
      sortOrder =
        filters.sortBy === sortBy && filters.sortOrder === 'desc'
          ? 'asc'
          : 'desc'
    }

    updateFilters({ sortBy, sortOrder })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilters({ tags: newTags })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      tags: [],
      ownership: null,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.tags.length > 0 ||
    filters.dateRange ||
    filters.ownership

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Sort */}
      <div className='flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search images...'
            value={searchValue}
            onChange={e => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Sort Options */}
        <div className='flex gap-2'>
          <Button
            variant={filters.sortBy === 'created_at' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleSortChange('created_at')}
            className='flex items-center gap-1'
          >
            <Calendar className='h-4 w-4' />
            Date
            {filters.sortBy === 'created_at' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className='h-3 w-3' />
              ) : (
                <SortAsc className='h-3 w-3' />
              ))}
          </Button>

          <Button
            variant={filters.sortBy === 'original_name' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleSortChange('original_name')}
            className='flex items-center gap-1'
          >
            Name
            {filters.sortBy === 'original_name' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className='h-3 w-3' />
              ) : (
                <SortAsc className='h-3 w-3' />
              ))}
          </Button>

          <Button
            variant={filters.sortBy === 'file_size' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleSortChange('file_size')}
            className='flex items-center gap-1'
          >
            Size
            {filters.sortBy === 'file_size' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className='h-3 w-3' />
              ) : (
                <SortAsc className='h-3 w-3' />
              ))}
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowAdvanced(!showAdvanced)}
            className='flex items-center gap-1'
          >
            <Filter className='h-4 w-4' />
            Filters
          </Button>
        </div>
      </div>

      {/* Ownership Filter - Conditional based on subscription status */}
      {hasActiveSubscription ? (
        /* Subscription User - Show unlimited access message */
        <div className='flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200'>
          <Crown className='h-5 w-5 text-purple-600' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-purple-900'>
              Premium Access Active
            </p>
            <p className='text-xs text-purple-700'>
              All images are available for unlimited download
            </p>
          </div>
        </div>
      ) : (
        /* Non-subscription User - Show ownership filters */
        <div className='flex items-center gap-1 bg-gray-100 rounded-lg p-1'>
          <button
            onClick={() => updateFilters({ ownership: null })}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              !filters.ownership
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                !filters.ownership
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              )}
            >
              {!filters.ownership && (
                <div className='w-2 h-2 rounded-full bg-white' />
              )}
            </div>
            All Images
          </button>

          <button
            onClick={() => updateFilters({ ownership: 'owned' })}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              filters.ownership === 'owned'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                filters.ownership === 'owned'
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300'
              )}
            >
              {filters.ownership === 'owned' && (
                <div className='w-2 h-2 rounded-full bg-white' />
              )}
            </div>
            <Check className='h-4 w-4' />
            Owned
          </button>

          <button
            onClick={() => updateFilters({ ownership: 'for-sale' })}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              filters.ownership === 'for-sale'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                filters.ownership === 'for-sale'
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-300'
              )}
            >
              {filters.ownership === 'for-sale' && (
                <div className='w-2 h-2 rounded-full bg-white' />
              )}
            </div>
            <ShoppingCart className='h-4 w-4' />
            For Sale
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className='space-y-4 p-4 bg-gray-50 rounded-lg'>
          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Tag className='h-4 w-4 text-gray-600' />
                <span className='text-sm font-medium text-gray-700'>Tags</span>
              </div>
              <div className='flex flex-wrap gap-2'>
                {availableTags.map(tag => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handleTagToggle(tag)}
                    className='text-xs'
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <Calendar className='h-4 w-4 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                Date Range
              </span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                type='date'
                value={filters.dateRange?.start || ''}
                onChange={e =>
                  updateFilters({
                    dateRange: {
                      start: e.target.value,
                      end: filters.dateRange?.end || '',
                    },
                  })
                }
                className='text-sm'
              />
              <Input
                type='date'
                value={filters.dateRange?.end || ''}
                onChange={e =>
                  updateFilters({
                    dateRange: {
                      start: filters.dateRange?.start || '',
                      end: e.target.value,
                    },
                  })
                }
                className='text-sm'
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <span>Active filters:</span>
          {filters.search && (
            <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full'>
              Search: {filters.search}
              <button
                onClick={() => handleSearchChange('')}
                className='hover:bg-blue-200 rounded-full p-0.5'
              >
                <X className='h-3 w-3' />
              </button>
            </span>
          )}
          {filters.tags.map(tag => (
            <span
              key={tag}
              className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full'
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className='hover:bg-green-200 rounded-full p-0.5'
              >
                <X className='h-3 w-3' />
              </button>
            </span>
          ))}
          {filters.ownership && (
            <span className='inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full'>
              {filters.ownership === 'owned' ? 'Owned' : 'For Sale'}
              <button
                onClick={() => updateFilters({ ownership: null })}
                className='hover:bg-purple-200 rounded-full p-0.5'
              >
                <X className='h-3 w-3' />
              </button>
            </span>
          )}
          <Button
            variant='ghost'
            size='sm'
            onClick={clearFilters}
            className='text-xs'
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
