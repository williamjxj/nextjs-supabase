'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  title?: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  showToast: (description: string, type: ToastType, title?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = React.useCallback(
    (description: string, type: ToastType, title?: string) => {
      addToast({ description, type, title })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className='fixed top-4 right-4 z-[60] flex flex-col gap-3 max-w-sm w-full sm:w-96'>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'backdrop-blur-lg rounded-xl border shadow-lg shadow-black/5'

    switch (type) {
      case 'success':
        return `${baseStyles} bg-emerald-50/90 border-emerald-200/50 dark:bg-emerald-950/90 dark:border-emerald-800/50`
      case 'error':
        return `${baseStyles} bg-red-50/90 border-red-200/50 dark:bg-red-950/90 dark:border-red-800/50`
      case 'warning':
        return `${baseStyles} bg-amber-50/90 border-amber-200/50 dark:bg-amber-950/90 dark:border-amber-800/50`
      case 'info':
        return `${baseStyles} bg-blue-50/90 border-blue-200/50 dark:bg-blue-950/90 dark:border-blue-800/50`
      default:
        return `${baseStyles} bg-white/90 border-gray-200/50 dark:bg-gray-950/90 dark:border-gray-800/50`
    }
  }

  const getIcon = (type: ToastType) => {
    const iconClass = 'w-5 h-5 flex-shrink-0'

    switch (type) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <svg
              className={`${iconClass} text-emerald-600 dark:text-emerald-400`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50">
            <svg
              className={`${iconClass} text-red-600 dark:text-red-400`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <svg
              className={`${iconClass} text-amber-600 dark:text-amber-400`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <svg
              className={`${iconClass} text-blue-600 dark:text-blue-400`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-out p-4',
        getToastStyles(toast.type),
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      )}
    >
      <div className='flex items-start gap-3'>
        {getIcon(toast.type)}
        <div className='flex-1 min-w-0'>
          {toast.title && (
            <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1'>
              {toast.title}
            </p>
          )}
          {toast.description && (
            <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className='flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors'
          aria-label="Dismiss notification"
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export { ToastItem }
