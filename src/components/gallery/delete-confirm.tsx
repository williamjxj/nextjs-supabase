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
    <Modal isOpen={isOpen} onClose={onClose} size='sm'>
      <div className='p-6'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Delete Image
            </h3>
            <p className='text-sm text-gray-500'>
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className='mb-6'>
          <p className='text-sm text-gray-700'>
            Are you sure you want to delete{' '}
            <span className='font-medium'>
              &quot;{image.original_name}&quot;
            </span>
            ? This will permanently remove the image from your gallery and
            storage.
          </p>
        </div>

        <div className='flex gap-3 justify-end'>
          <Button variant='outline' onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Image'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
