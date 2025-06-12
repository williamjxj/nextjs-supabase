'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

interface TooltipProps {
  children: React.ReactElement<any>
  content: React.ReactNode
  trigger?: 'hover' | 'click'
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  contentClassName?: string
  delay?: number
  offset?: number
  disabled?: boolean
  showCloseButton?: boolean
  persistOnHover?: boolean
}

export const Tooltip = ({
  children,
  content,
  trigger = 'hover',
  placement = 'bottom',
  className,
  contentClassName,
  delay = 200,
  offset = 8,
  disabled = false,
  showCloseButton = false,
  persistOnHover = false,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isPersistent, setIsPersistent] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - offset
        left =
          triggerRect.left +
          scrollX +
          (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + scrollY + offset
        left =
          triggerRect.left +
          scrollX +
          (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top =
          triggerRect.top +
          scrollY +
          (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left + scrollX - tooltipRect.width - offset
        break
      case 'right':
        top =
          triggerRect.top +
          scrollY +
          (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + scrollX + offset
        break
    }

    // Keep tooltip within viewport with better boundaries
    const padding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    left = Math.max(
      padding,
      Math.min(left, viewportWidth - tooltipRect.width - padding)
    )
    top = Math.max(
      padding,
      Math.min(top, viewportHeight + scrollY - tooltipRect.height - padding)
    )

    setPosition({ top, left })
  }, [placement, offset])

  const showTooltip = useCallback(() => {
    if (disabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [disabled, delay])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (!isPersistent) {
      setIsVisible(false)
    }
  }, [isPersistent])

  const forceHideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
    setIsPersistent(false)
  }, [])

  const handleTooltipClick = useCallback(() => {
    if (showCloseButton || persistOnHover) {
      setIsPersistent(true)
    }
  }, [showCloseButton, persistOnHover])

  const toggleTooltip = useCallback(() => {
    if (disabled) return
    if (!isVisible) {
      setIsVisible(true)
      // Auto-persist if tooltip has close button
      if (showCloseButton) {
        setIsPersistent(true)
      }
    } else {
      // Only allow hiding via close button when persistent
      if (!isPersistent) {
        setIsVisible(false)
      }
    }
  }, [disabled, isVisible, showCloseButton, isPersistent])

  useEffect(() => {
    if (isVisible) {
      calculatePosition()
    }
  }, [isVisible, content, calculatePosition])

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition()
      }
    }

    const handleScroll = () => {
      if (isVisible) {
        calculatePosition()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        trigger === 'click' &&
        isVisible &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        // Don't hide if tooltip is persistent (has close button)
        if (!isPersistent && !showCloseButton) {
          hideTooltip()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [
    isVisible,
    calculatePosition,
    trigger,
    isPersistent,
    hideTooltip,
    showCloseButton,
  ])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Clone the trigger element and add event handlers
  const triggerElement = React.cloneElement(children, {
    ...children.props,
    ref: triggerRef,
    className: cn(children.props.className as string, className),
    ...(trigger === 'hover' && {
      onMouseEnter: (e: React.MouseEvent) => {
        showTooltip()
        if (children.props.onMouseEnter) {
          children.props.onMouseEnter(e)
        }
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hideTooltip()
        if (children.props.onMouseLeave) {
          children.props.onMouseLeave(e)
        }
      },
    }),
    ...(trigger === 'click' && {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleTooltip()
        if (children.props.onClick) {
          ;(children.props.onClick as (e: React.MouseEvent) => void)(e)
        }
      },
    }),
  })

  const tooltipContent = mounted && (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[55] px-4 py-3 text-sm font-medium rounded-2xl shadow-2xl backdrop-blur-xl',
        'bg-slate-900/95 text-white border border-slate-700/50',
        'dark:bg-slate-800/95 dark:text-gray-50 dark:border-slate-600/50',
        'select-none max-w-xs',
        isPersistent || showCloseButton
          ? 'pointer-events-auto'
          : 'pointer-events-none',
        'transition-all duration-300 ease-out',
        isVisible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-1 pointer-events-none',
        contentClassName
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      onClick={handleTooltipClick}
      onMouseEnter={() => {
        if (persistOnHover && trigger === 'hover') {
          setIsPersistent(true)
        }
      }}
    >
      {/* Close button */}
      {(showCloseButton || isPersistent) && (
        <button
          onClick={e => {
            e.stopPropagation()
            forceHideTooltip()
          }}
          className='absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-700/70 hover:bg-slate-600/80 dark:bg-slate-600/70 dark:hover:bg-slate-500/80 flex items-center justify-center text-xs text-gray-300 hover:text-white transition-colors duration-200'
          aria-label='Close tooltip'
        >
          ×
        </button>
      )}

      {/* Content with padding for close button when needed */}
      <div
        className={cn(
          (showCloseButton || isPersistent) && 'pr-6',
          (showCloseButton || isPersistent) && 'max-h-80 overflow-y-auto'
        )}
      >
        {content}
      </div>

      {/* Arrow */}
      <div
        className={cn(
          'absolute w-2 h-2 rotate-45',
          'bg-slate-900/95 border-slate-700/50',
          'dark:bg-slate-800/95 dark:border-slate-600/50',
          placement === 'top' &&
            'bottom-[-4px] left-1/2 transform -translate-x-1/2 border-r border-b',
          placement === 'bottom' &&
            'top-[-4px] left-1/2 transform -translate-x-1/2 border-l border-t',
          placement === 'left' &&
            'right-[-4px] top-1/2 transform -translate-y-1/2 border-t border-r',
          placement === 'right' &&
            'left-[-4px] top-1/2 transform -translate-y-1/2 border-b border-l'
        )}
      />
    </div>
  )

  return (
    <>
      {triggerElement}
      {mounted && isVisible && createPortal(tooltipContent, document.body)}
    </>
  )
}

export default Tooltip
