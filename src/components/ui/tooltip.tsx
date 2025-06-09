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
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
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
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + scrollY + offset
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left + scrollX - tooltipRect.width - offset
        break
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + scrollX + offset
        break
    }

    // Keep tooltip within viewport
    const padding = 10
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight + scrollY - tooltipRect.height - padding))

    setPosition({ top, left })
  }, [placement, offset])

  const showTooltip = () => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const toggleTooltip = () => {
    if (disabled) return
    setIsVisible(!isVisible)
  }

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

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isVisible, calculatePosition])

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
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
    }),
    ...(trigger === 'click' && {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleTooltip()
        if (children.props.onClick) {
          (children.props.onClick as (e: React.MouseEvent) => void)(e)
        }
      },
    }),
  })

  const tooltipContent = mounted && isVisible && (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg',
        'pointer-events-none select-none',
        'opacity-0 animate-in fade-in-0 zoom-in-95 duration-150',
        isVisible && 'opacity-100',
        contentClassName
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {content}
      
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-2 h-2 bg-gray-900 rotate-45',
          placement === 'top' && 'bottom-[-4px] left-1/2 transform -translate-x-1/2',
          placement === 'bottom' && 'top-[-4px] left-1/2 transform -translate-x-1/2',
          placement === 'left' && 'right-[-4px] top-1/2 transform -translate-y-1/2',
          placement === 'right' && 'left-[-4px] top-1/2 transform -translate-y-1/2'
        )}
      />
    </div>
  )

  return (
    <>
      {triggerElement}
      {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  )
}

export default Tooltip
