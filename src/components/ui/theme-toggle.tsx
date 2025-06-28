'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/theme-context'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse' />
    )
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  const currentTheme = themes.find(t => t.value === theme)
  const CurrentIcon = currentTheme?.icon || Sun

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
          'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
          'text-gray-700 dark:text-gray-300 hover:scale-105',
          'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        )}
        aria-label={`Current theme: ${currentTheme?.label}. Click to change theme`}
        title={`Current: ${currentTheme?.label}`}
      >
        <CurrentIcon className='w-5 h-5' />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-10'
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className='absolute right-0 top-12 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20'>
            <div className='py-1'>
              {themes.map(themeOption => {
                const Icon = themeOption.icon
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      theme === themeOption.value
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <Icon className='w-4 h-4' />
                    {themeOption.label}
                    {theme === themeOption.value && (
                      <div className='ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full' />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
