'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

export interface GalleryFilters {
  search: string;
  sortBy: 'created_at' | 'title' | 'file_size';
  sortOrder: 'asc' | 'desc';
  tags: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

interface GalleryFiltersProps {
  filters: GalleryFilters;
  availableTags: string[];
  onFiltersChange: (filters: GalleryFilters) => void;
  className?: string;
}

export function GalleryFilters({
  filters,
  availableTags,
  onFiltersChange,
  className,
}: GalleryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<GalleryFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value });
  };

  const handleSortChange = (sortBy: GalleryFilters['sortBy']) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    updateFilters({ sortBy, sortOrder });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      tags: [],
    });
  };

  const hasActiveFilters = filters.search || filters.tags.length > 0 || filters.dateRange;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search images..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Button
            variant={filters.sortBy === 'created_at' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('created_at')}
            className="flex items-center gap-1"
          >
            <Calendar className="h-4 w-4" />
            Date
            {filters.sortBy === 'created_at' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className="h-3 w-3" />
              ) : (
                <SortAsc className="h-3 w-3" />
              ))}
          </Button>
          
          <Button
            variant={filters.sortBy === 'title' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('title')}
            className="flex items-center gap-1"
          >
            Title
            {filters.sortBy === 'title' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className="h-3 w-3" />
              ) : (
                <SortAsc className="h-3 w-3" />
              ))}
          </Button>
          
          <Button
            variant={filters.sortBy === 'file_size' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('file_size')}
            className="flex items-center gap-1"
          >
            Size
            {filters.sortBy === 'file_size' &&
              (filters.sortOrder === 'desc' ? (
                <SortDesc className="h-3 w-3" />
              ) : (
                <SortAsc className="h-3 w-3" />
              ))}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Date Range</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) =>
                  updateFilters({
                    dateRange: {
                      start: e.target.value,
                      end: filters.dateRange?.end || '',
                    },
                  })
                }
                className="text-sm"
              />
              <Input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) =>
                  updateFilters({
                    dateRange: {
                      start: filters.dateRange?.start || '',
                      end: e.target.value,
                    },
                  })
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Search: {filters.search}
              <button
                onClick={() => handleSearchChange('')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
