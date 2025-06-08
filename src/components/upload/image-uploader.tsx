'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useUpload } from '@/hooks/use-upload'
import { validateFile } from '@/lib/utils/file-validation'
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
        'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
        'bg-gradient-to-br from-gray-50 to-gray-100/50',
        isDragOver
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50/30 shadow-lg shadow-blue-500/20 scale-[1.02]'
          : 'border-gray-300 hover:border-blue-400 hover:shadow-md hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/10',
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
        <div className='space-y-6'>
          <div className='mx-auto w-16 h-16 text-gray-400'>
            <svg fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={1.5}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'
              />
            </svg>
          </div>
          <div>
            <p className='text-lg font-semibold text-gray-900 mb-2'>
              {isDragOver
                ? 'Drop your images here'
                : 'Drag & drop images here'}
            </p>
            <p className='text-gray-600 mb-4'>
              or <span className='text-blue-600 font-medium'>click to browse</span>
            </p>
            <p className='text-sm text-gray-500'>
              Support for JPG, PNG, WebP • Max 10MB per file
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
  }, [file, preview])

  return (
    <div className='relative group'>
      <div className='aspect-square w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200'>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={file.name}
            className='w-full h-full object-cover'
          />
        )}
      </div>
      <button
        onClick={onRemove}
        className='absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg cursor-pointer'
        title="Remove file"
      >
        ×
      </button>
      <p className='text-xs text-gray-600 mt-2 truncate max-w-28 text-center font-medium'>
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
    <div className='flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
      <div className='flex-shrink-0'>{getStatusIcon()}</div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-gray-900 truncate'>{fileName}</p>
        <div className='w-full bg-gray-200 rounded-full h-2.5 mt-2'>
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className='text-sm font-medium text-gray-600'>
        {status === 'uploading' ? `${progress}%` : status}
      </div>
    </div>
  )
}

export const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [justAddedFiles, setJustAddedFiles] = useState(false)
  const { uploadFiles, uploading, progress, error, resetUploadState } =
    useUpload()
  const { addToast } = useToast()

  // Reset the bounce animation after a short delay
  useEffect(() => {
    if (justAddedFiles) {
      const timer = setTimeout(() => setJustAddedFiles(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [justAddedFiles])

  const handleFileSelect = useCallback(
    (files: FileList) => {
      // Batch all validation and filtering first
      const { validFiles, errors } = Array.from(files).reduce(
        (acc, file) => {
          const validation = validateFile(file)
          if (validation.valid) {
            acc.validFiles.push(file)
          } else {
            acc.errors.push(`${file.name}: ${validation.error}`)
          }
          return acc
        },
        { validFiles: [] as File[], errors: [] as string[] }
      )

      if (errors.length > 0) {
        addToast({
          type: 'error',
          title: 'File validation errors',
          description: errors.join(', '),
        })
      }

      if (validFiles.length > 0) {
        // Only update state once with all valid files
        setSelectedFiles(prev => [...prev, ...validFiles])
        // Trigger bounce animation for the upload button
        setJustAddedFiles(true)
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
      await uploadFiles(selectedFiles)
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
        description: error || 'An error occurred during upload',
      })
    }
  }, [selectedFiles, uploadFiles, error, addToast, resetUploadState])

  return (
    <div className='w-full max-w-4xl mx-auto'>
      <div className='krea-card p-8 space-y-8'>
        <DragDropZone
          onFileSelect={handleFileSelect}
          disabled={uploading}
          multiple
        />

        {selectedFiles.length > 0 && (
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Selected files ({selectedFiles.length})
            </h3>
            <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4'>
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

        {uploading && progress.length > 0 && (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-gray-900'>Upload Progress</h3>
            <div className='space-y-3'>
              {progress.map((item, index) => (
                <UploadProgress
                  key={index}
                  fileName={item.fileName}
                  progress={item.progress}
                  status={item.status}
                />
              ))}
            </div>
          </div>
        )}

        <div className='flex gap-3'>
          <Button
            onClick={async e => {
              e.preventDefault()
              await handleUpload()
            }}
            disabled={selectedFiles.length === 0 || uploading}
            className={cn(
              'flex-1 transition-all duration-300 relative overflow-hidden',
              selectedFiles.length > 0 && !uploading
                ? [
                    'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600',
                    'hover:from-blue-700 hover:via-purple-700 hover:to-blue-700',
                    'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40',
                    'ring-2 ring-blue-500/30 hover:ring-purple-500/50',
                    'scale-[1.02] hover:scale-[1.03]',
                    'font-semibold text-white',
                    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
                    'before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
                    'animate-pulse',
                    justAddedFiles && 'animate-bounce',
                  ]
                : [
                    // Default button styles when no files selected
                    'bg-muted text-muted-foreground',
                  ]
            )}
            style={{
              backgroundSize: '200% 100%',
            }}
          >
            <span className='flex items-center gap-2'>
              {uploading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Uploading...
                </>
              ) : selectedFiles.length > 0 ? (
                <>
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'
                    />
                  </svg>
                  Upload {selectedFiles.length} file
                  {selectedFiles.length !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 4.5v15m7.5-7.5h-15'
                    />
                  </svg>
                  Select files to upload
                </>
              )}
            </span>
          </Button>

          {selectedFiles.length > 0 && !uploading && (
            <Button 
              variant='outline' 
              onClick={() => setSelectedFiles([])}
              className="krea-button"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
