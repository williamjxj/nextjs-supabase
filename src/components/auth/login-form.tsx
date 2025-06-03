'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { LoginFormData } from '@/types/auth'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export const LoginForm = ({
  onSuccess,
  redirectTo = '/gallery',
}: LoginFormProps) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { signIn } = useAuth()
  const { addToast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(formData.email, formData.password)
      addToast({
        type: 'success',
        title: 'Login successful',
        description: 'Welcome back!',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred during login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = formData.email && formData.password

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Sign in</CardTitle>
        <CardDescription className='text-center'>
          Enter your email and password to access your gallery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='email' className='text-sm font-medium'>
              Email
            </label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='Enter your email'
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='password' className='text-sm font-medium'>
              Password
            </label>
            <Input
              id='password'
              name='password'
              type='password'
              placeholder='Enter your password'
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className='mt-4 text-center text-sm'>
          <span className='text-muted-foreground'>
            Don&apos;t have an account?{' '}
          </span>
          <Button
            variant='link'
            className='p-0 h-auto font-normal'
            onClick={() => router.push('/signup')}
            disabled={isLoading}
          >
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
