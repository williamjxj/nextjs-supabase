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

    // Keep tooltip within viewport with better boundaries
    const padding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding))
    top = Math.max(padding, Math.min(top, viewportHeight + scrollY - tooltipRect.height - padding))

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

    const handleClickOutside = (event: MouseEvent) => {
      if (trigger === 'click' && isVisible && 
          tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        hideTooltip()
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
  }, [isVisible, calculatePosition, trigger])

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
          (children.props.onClick as (e: React.MouseEvent) => void)(e)
        }
      },
    }),
  })

  const tooltipContent = mounted && (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[55] px-4 py-3 text-sm font-normal rounded-2xl shadow-xl backdrop-blur-xl',
        'bg-white/98 text-gray-700 border border-gray-200/60',
        'dark:bg-gray-800/98 dark:text-gray-200 dark:border-gray-700/60',
        'pointer-events-none select-none max-w-xs',
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
    >
      {content}
      
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-2 h-2 rotate-45',
          'bg-white/98 border-gray-200/60',
          'dark:bg-gray-800/98 dark:border-gray-700/60',
          placement === 'top' && 'bottom-[-4px] left-1/2 transform -translate-x-1/2 border-r border-b',
          placement === 'bottom' && 'top-[-4px] left-1/2 transform -translate-x-1/2 border-l border-t',
          placement === 'left' && 'right-[-4px] top-1/2 transform -translate-y-1/2 border-t border-r',
          placement === 'right' && 'left-[-4px] top-1/2 transform -translate-y-1/2 border-b border-l'
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
