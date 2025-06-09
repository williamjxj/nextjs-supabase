'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}

interface UploadState {
  uploading: boolean
  progress: UploadProgress[]
  error: string | null
}

export const useUpload = () => {
  const { user } = useAuth()
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: [],
    error: null,
  })

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) {
        throw new Error('User must be authenticated to upload files')
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]
      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type)
        throw new Error(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
        )
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        console.error('File too large:', file.size)
        throw new Error('File size too large. Maximum 10MB allowed.')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      return result.image
    },
    [user]
  )

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!user) {
        throw new Error('User must be authenticated to upload files')
      }

      setUploadState({
        uploading: true,
        progress: files.map(file => ({
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const,
        })),
        error: null,
      })

      const results = []
      const uploadPromises = files.map(async (file, i) => {
        try {
          // Update progress for current file
          setUploadState(prev => ({
            ...prev,
            progress: prev.progress.map((item, index) =>
              index === i
                ? { ...item, progress: 10, status: 'uploading' as const }
                : item
            ),
          }))

          const result = await uploadFile(file)

          // Update progress to complete
          setUploadState(prev => ({
            ...prev,
            progress: prev.progress.map((item, index) =>
              index === i
                ? { ...item, progress: 100, status: 'success' as const }
                : item
            ),
          }))

          return result
        } catch (error) {
          setUploadState(prev => ({
            ...prev,
            progress: prev.progress.map((item, index) =>
              index === i ? { ...item, status: 'error' as const } : item
            ),
          }))
          throw error
        }
      })

      try {
        const uploadResults = await Promise.all(uploadPromises)
        setUploadState(prev => ({ ...prev, uploading: false }))
        return uploadResults
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed'
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [user, uploadFile]
  )

  const resetUploadState = useCallback(() => {
    setUploadState({ uploading: false, progress: [], error: null })
  }, [])

  return {
    uploadFile,
    uploadFiles,
    uploading: uploadState.uploading,
    progress: uploadState.progress,
    error: uploadState.error,
    resetUploadState,
  }
}
