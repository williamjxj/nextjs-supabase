'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Image as ImageType } from '@/types/image'

interface DeleteConfirmProps {
  image: ImageType | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (image: ImageType) => Promise<void>
  isDeleting?: boolean
}

export function DeleteConfirm({
  image,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmProps) {
  const handleConfirm = async () => {
    if (!image) return
    await onConfirm(image)
    onClose()
  }

  if (!image) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='lg'
      preventBackdropClose={true}
    >
      <div className='p-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-700'>
        <div className='flex items-center gap-6 mb-8'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-600'>
            <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
          <div>
            <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
              Delete Image
            </h3>
            <p className='text-base text-red-600 dark:text-red-400 font-semibold'>
              ⚠️ This action cannot be undone!
            </p>
          </div>
        </div>

        <div className='mb-8 p-6 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-red-300 dark:border-red-600'>
          <p className='text-base text-gray-900 dark:text-gray-100 leading-relaxed'>
            Are you sure you want to permanently delete{' '}
            <span className='font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/50 px-2 py-1 rounded'>
              &quot;{image.original_name}&quot;
            </span>
            ?
          </p>
          <p className='text-sm text-gray-700 dark:text-gray-300 mt-3'>
            This will permanently remove the image from your gallery and
            storage. You won&apos;t be able to recover it.
          </p>
        </div>

        <div className='flex gap-4 justify-end'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isDeleting}
            className='px-8 py-3 font-semibold text-lg border-2 hover:bg-gray-100 dark:hover:bg-gray-700'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={isDeleting}
            className='px-8 py-3 font-semibold text-lg bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 shadow-lg'
          >
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Image'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
