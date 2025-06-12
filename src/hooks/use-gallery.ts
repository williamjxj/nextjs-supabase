'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { downloadImage } from '@/lib/supabase/storage'
import { useAuth } from './use-auth'
import { Image } from '@/types/image'

export interface GalleryFilters {
  search?: string
  sortBy?: 'created_at' | 'original_name' | 'file_size'
  sortOrder?: 'asc' | 'desc'
  dateRange?: {
    start: string
    end: string
  }
}

export interface GalleryPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface GalleryState {
  images: Image[]
  loading: boolean
  error: string | null
  pagination: GalleryPagination | null
  filters: GalleryFilters
}

export const useGallery = () => {
  const { user } = useAuth()
  const [galleryState, setGalleryState] = useState<GalleryState>({
    images: [],
    loading: false,
    error: null,
    pagination: null,
    filters: {
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  })

  // Use ref to prevent duplicate API calls
  const fetchInProgressRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchImages = useCallback(
    async (
      filters?: Partial<GalleryFilters>,
      pagination?: { limit?: number; offset?: number }
    ) => {
      // Prevent duplicate calls
      if (fetchInProgressRef.current) {
        return
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()
      fetchInProgressRef.current = true

      // Get current state synchronously to avoid race conditions
      let finalFilters: GalleryFilters = {
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      }

      setGalleryState(prev => {
        finalFilters = {
          search: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
          ...prev.filters,
          ...filters,
        }

        return {
          ...prev,
          loading: true,
          error: null,
          filters: finalFilters,
        }
      })

      try {
        const searchParams = new URLSearchParams()

        // Apply filters with safe access
        if (finalFilters.search) {
          searchParams.set('search', finalFilters.search)
        }
        if (finalFilters.sortBy) {
          searchParams.set('sortBy', finalFilters.sortBy)
        }
        if (finalFilters.sortOrder) {
          searchParams.set('sortOrder', finalFilters.sortOrder)
        }

        // Apply pagination
        if (pagination?.limit)
          searchParams.set('limit', pagination.limit.toString())
        if (pagination?.offset)
          searchParams.set('offset', pagination.offset.toString())

        const response = await fetch(
          `/api/gallery?${searchParams.toString()}`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API error response:', errorText)
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          )
        }

        const data = await response.json()

        setGalleryState(prev => ({
          ...prev,
          images: data.images || [],
          loading: false,
          error: null,
          pagination: data.pagination,
        }))
      } catch (error) {
        // Don't set error if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        console.error('Error fetching images:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch images'
        setGalleryState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      } finally {
        fetchInProgressRef.current = false
        abortControllerRef.current = null
      }
    },
    [] // fetchImages doesn't depend on user since API is public
  )

  const deleteImage = async (image: Image) => {
    if (!user) return

    try {
      // Delete via API endpoint
      const response = await fetch(`/api/gallery?id=${image.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Update local state
      setGalleryState(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== image.id),
        pagination: prev.pagination
          ? {
              ...prev.pagination,
              total: prev.pagination.total - 1,
            }
          : null,
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete image'
      setGalleryState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }

  const downloadImageFile = async (image: Image) => {
    try {
      const blob = await downloadImage(image.storage_path)

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to download image'
      setGalleryState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }

  const updateFilters = useCallback(
    (newFilters: Partial<GalleryFilters>) => {
      // Use the latest fetchImages directly since it's stable due to useCallback with [user]
      fetchImages(newFilters, { offset: 0 })
    },
    [fetchImages]
  )

  const loadMore = useCallback(() => {
    setGalleryState(prev => {
      if (prev.pagination?.hasMore) {
        const newOffset = prev.pagination.offset + prev.pagination.limit
        fetchImages({}, { offset: newOffset })
      }
      return prev
    })
  }, [fetchImages])

  const goToPage = useCallback(
    (page: number) => {
      setGalleryState(prev => {
        if (!prev.pagination) return prev

        const newOffset = (page - 1) * prev.pagination.limit
        fetchImages({}, { offset: newOffset })
        return prev
      })
    },
    [fetchImages]
  )

  const goToNextPage = useCallback(() => {
    setGalleryState(prev => {
      if (!prev.pagination?.hasMore) return prev

      const newOffset = prev.pagination.offset + prev.pagination.limit
      fetchImages({}, { offset: newOffset })
      return prev
    })
  }, [fetchImages])

  const goToPrevPage = useCallback(() => {
    setGalleryState(prev => {
      if (!prev.pagination || prev.pagination.offset === 0) return prev

      const newOffset = Math.max(
        0,
        prev.pagination.offset - prev.pagination.limit
      )
      fetchImages({}, { offset: newOffset })
      return prev
    })
  }, [fetchImages])

  const refetch = useCallback(() => {
    fetchImages({}, { offset: 0 })
  }, [fetchImages])

  // Initial fetch on component mount (gallery is public, no user required)
  useEffect(() => {
    // Use the fetchImages function for consistency
    fetchImages({}, { offset: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once when component mounts, not dependent on fetchImages to avoid infinite loop

  return {
    ...galleryState,
    fetchImages,
    deleteImage,
    downloadImageFile,
    updateFilters,
    loadMore,
    goToPage,
    goToNextPage,
    goToPrevPage,
    refetch,
  }
}
