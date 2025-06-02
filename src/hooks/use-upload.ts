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
      console.log(
        'uploadFile called for:',
        file.name,
        'size:',
        file.size,
        'type:',
        file.type
      )

      if (!user) {
        console.error('User not authenticated in uploadFile')
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
      console.log('Making POST request to /api/upload')

      // Upload via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      console.log('Upload response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Upload failed with error:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful, result:', result)
      return result.image
    },
    [user]
  )

  const uploadFiles = useCallback(
    async (files: File[]) => {
      console.log('uploadFiles called with:', files.length, 'files')
      console.log('User authenticated:', !!user)

      if (!user) {
        console.error('User not authenticated')
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

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          console.log(`Uploading file ${i + 1}/${files.length}:`, file.name)

          // Update progress for current file
          setUploadState(prev => ({
            ...prev,
            progress: prev.progress.map((item, index) =>
              index === i
                ? { ...item, progress: 50, status: 'uploading' as const }
                : item
            ),
          }))

          try {
            const result = await uploadFile(file)
            results.push(result)

            // Mark file as successful
            setUploadState(prev => ({
              ...prev,
              progress: prev.progress.map((item, index) =>
                index === i
                  ? { ...item, progress: 100, status: 'success' as const }
                  : item
              ),
            }))
          } catch (error) {
            // Mark file as error
            setUploadState(prev => ({
              ...prev,
              progress: prev.progress.map((item, index) =>
                index === i ? { ...item, status: 'error' as const } : item
              ),
            }))
            throw error
          }
        }

        setUploadState(prev => ({ ...prev, uploading: false }))
        return results
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
