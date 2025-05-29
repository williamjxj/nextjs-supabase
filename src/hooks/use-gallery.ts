'use client'

import { useState, useEffect } from 'react'
import { getUserImages, deleteImageMetadata } from '@/lib/supabase/database'
import {
  deleteImage as deleteStorageImage,
  downloadImage,
} from '@/lib/supabase/storage'
import { useAuth } from './use-auth'
import { Image } from '@/types/image'

interface GalleryState {
  images: Image[]
  loading: boolean
  error: string | null
}

export const useGallery = () => {
  const { user } = useAuth()
  const [galleryState, setGalleryState] = useState<GalleryState>({
    images: [],
    loading: false,
    error: null,
  })

  const fetchImages = async () => {
    if (!user) return

    setGalleryState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const images = await getUserImages(user.id)
      setGalleryState({
        images,
        loading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch images'
      setGalleryState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
    }
  }

  const deleteImage = async (image: Image) => {
    if (!user) return

    try {
      // Delete from storage
      await deleteStorageImage(image.storage_path)

      // Delete from database
      await deleteImageMetadata(image.id, user.id)

      // Update local state
      setGalleryState(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== image.id),
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

  // Fetch images when user changes
  useEffect(() => {
    if (user) {
      fetchImages()
    } else {
      setGalleryState({ images: [], loading: false, error: null })
    }
  }, [user])

  return {
    ...galleryState,
    fetchImages,
    deleteImage,
    downloadImageFile,
    refetch: fetchImages,
  }
}
