'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useUpload } from '@/hooks/use-upload'
import { validateImageFile } from '@/lib/utils/file-validation'
import { cn } from '@/lib/utils/cn'

interface DragDropZoneProps {
  onFileSelect: (files: FileList) => void
  disabled?: boolean
  accept?: string
  multiple?: boolean
  children?: React.ReactNode
}

const DragDropZone = ({
  onFileSelect,
  disabled = false,
  accept = 'image/*',
  multiple = false,
  children,
}: DragDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (!disabled && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files)
      }
    },
    [disabled, onFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files)
      }
    },
    [onFileSelect]
  )

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className='hidden'
        disabled={disabled}
      />

      {children || (
        <div className='space-y-4'>
          <div className='mx-auto w-12 h-12 text-muted-foreground'>
            <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
              />
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium'>
              {isDragOver
                ? 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              Supports JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ThumbnailPreviewProps {
  file: File
  onRemove: () => void
}

const ThumbnailPreview = ({ file, onRemove }: ThumbnailPreviewProps) => {
  const [preview, setPreview] = useState<string>('')

  React.useEffect(() => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [file])

  return (
    <div className='relative group'>
      <div className='aspect-square w-24 h-24 rounded-lg overflow-hidden border border-border'>
        {preview && (
          <img
            src={preview}
            alt={file.name}
            className='w-full h-full object-cover'
          />
        )}
      </div>
      <button
        onClick={onRemove}
        className='absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity'
      >
        ×
      </button>
      <p className='text-xs text-muted-foreground mt-1 truncate max-w-24'>
        {file.name}
      </p>
    </div>
  )
}

interface UploadProgressProps {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}

const UploadProgress = ({
  fileName,
  progress,
  status,
}: UploadProgressProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-primary'
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg
            className='w-4 h-4 text-green-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        )
      case 'error':
        return (
          <svg
            className='w-4 h-4 text-destructive'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          </svg>
        )
      default:
        return (
          <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
        )
    }
  }

  return (
    <div className='flex items-center space-x-3 p-3 border rounded-lg'>
      <div className='flex-shrink-0'>{getStatusIcon()}</div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{fileName}</p>
        <div className='w-full bg-muted rounded-full h-2 mt-1'>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className='text-xs text-muted-foreground'>
        {status === 'uploading' ? `${progress}%` : status}
      </div>
    </div>
  )
}

export const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { uploadFile, uploadState, resetUploadState } = useUpload()
  const { addToast } = useToast()

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const validFiles: File[] = []
      const errors: string[] = []

      Array.from(files).forEach(file => {
        const validation = validateImageFile(file)
        if (validation.isValid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      })

      if (errors.length > 0) {
        addToast({
          type: 'error',
          title: 'File validation errors',
          description: errors.join(', '),
        })
      }

      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles])
      }
    },
    [addToast]
  )

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      addToast({
        type: 'error',
        title: 'No files selected',
        description: 'Please select files to upload',
      })
      return
    }

    try {
      // Upload files one by one
      for (const file of selectedFiles) {
        await uploadFile(file)
      }
      addToast({
        type: 'success',
        title: 'Upload successful',
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      })
      setSelectedFiles([])
      resetUploadState()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        description: uploadState.error || 'An error occurred during upload',
      })
    }
  }, [selectedFiles, uploadFile, uploadState.error, addToast, resetUploadState])

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='text-center'>Upload Images</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <DragDropZone
          onFileSelect={handleFileSelect}
          disabled={uploadState.uploading}
          multiple
        />

        {selectedFiles.length > 0 && (
          <div>
            <h3 className='text-sm font-medium mb-3'>
              Selected files ({selectedFiles.length})
            </h3>
            <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4'>
              {selectedFiles.map((file, index) => (
                <ThumbnailPreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => handleRemoveFile(index)}
                />
              ))}
            </div>
          </div>
        )}

        {uploadState.uploading && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>Upload Progress</h3>
            <UploadProgress
              fileName={selectedFiles[0]?.name || 'Uploading...'}
              progress={uploadState.progress}
              status={
                uploadState.uploading
                  ? 'uploading'
                  : uploadState.error
                    ? 'error'
                    : 'success'
              }
            />
          </div>
        )}

        <div className='flex gap-3'>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadState.uploading}
            className='flex-1'
          >
            {uploadState.uploading
              ? 'Uploading...'
              : `Upload ${selectedFiles.length} file(s)`}
          </Button>

          {selectedFiles.length > 0 && !uploadState.uploading && (
            <Button variant='outline' onClick={() => setSelectedFiles([])}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
