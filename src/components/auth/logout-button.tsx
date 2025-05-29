'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'

interface LogoutButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  redirectTo?: string
  showConfirmation?: boolean
}

export const LogoutButton = ({
  variant = 'outline',
  size = 'default',
  className,
  children,
  redirectTo = '/',
  showConfirmation = false,
}: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()
  const { addToast } = useToast()

  const handleLogout = async () => {
    if (showConfirmation && !confirm('Are you sure you want to sign out?')) {
      return
    }

    setIsLoading(true)

    try {
      await signOut()
      addToast({
        type: 'success',
        title: 'Signed out successfully',
        description: 'You have been logged out of your account',
      })
      router.push(redirectTo)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Logout failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred during logout',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
          Signing out...
        </div>
      ) : (
        children || 'Sign out'
      )}
    </Button>
  )
}
