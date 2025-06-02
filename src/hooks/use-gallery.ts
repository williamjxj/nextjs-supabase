'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const fetchImages = useCallback(
    async (
      filters?: Partial<GalleryFilters>,
      pagination?: { limit?: number; offset?: number }
    ) => {
      if (!user) return

      setGalleryState(prev => ({
        ...prev,
        loading: true,
        error: null,
        filters: { ...prev.filters, ...filters },
      }))

      try {
        const searchParams = new URLSearchParams()

        // Apply filters
        const finalFilters = { ...galleryState.filters, ...filters }
        if (finalFilters.search) searchParams.set('search', finalFilters.search)
        if (finalFilters.sortBy) searchParams.set('sortBy', finalFilters.sortBy)
        if (finalFilters.sortOrder)
          searchParams.set('sortOrder', finalFilters.sortOrder)

        // Apply pagination
        if (pagination?.limit)
          searchParams.set('limit', pagination.limit.toString())
        if (pagination?.offset)
          searchParams.set('offset', pagination.offset.toString())

        const response = await fetch(`/api/gallery?${searchParams.toString()}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setGalleryState(prev => ({
          ...prev,
          images: data.images,
          loading: false,
          error: null,
          pagination: data.pagination,
          filters: finalFilters,
        }))
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch images'
        setGalleryState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      }
    },
    [user, galleryState.filters]
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
      fetchImages(newFilters, { offset: 0 })
    },
    [fetchImages]
  )

  const loadMore = useCallback(() => {
    if (galleryState.pagination?.hasMore) {
      const newOffset =
        galleryState.pagination.offset + galleryState.pagination.limit
      fetchImages({}, { offset: newOffset })
    }
  }, [fetchImages, galleryState.pagination])

  const goToPage = useCallback(
    (page: number) => {
      if (!galleryState.pagination) return

      const newOffset = (page - 1) * galleryState.pagination.limit
      fetchImages({}, { offset: newOffset })
    },
    [fetchImages, galleryState.pagination]
  )

  const goToNextPage = useCallback(() => {
    if (!galleryState.pagination?.hasMore) return

    const newOffset =
      galleryState.pagination.offset + galleryState.pagination.limit
    fetchImages({}, { offset: newOffset })
  }, [fetchImages, galleryState.pagination])

  const goToPrevPage = useCallback(() => {
    if (!galleryState.pagination || galleryState.pagination.offset === 0) return

    const newOffset = Math.max(
      0,
      galleryState.pagination.offset - galleryState.pagination.limit
    )
    fetchImages({}, { offset: newOffset })
  }, [fetchImages, galleryState.pagination])

  // Fetch images when user changes
  useEffect(() => {
    if (user) {
      fetchImages()
    } else {
      setGalleryState({
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
    }
  }, [user])

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
    refetch: () => fetchImages({}, { offset: 0 }),
  }
}
