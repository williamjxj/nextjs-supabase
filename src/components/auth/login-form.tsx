'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import type { LoginFormData } from '@/types/auth'
import { SocialAuthSection } from './social-auth'
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const { addToast } = useToast()

  // Handle authentication errors from URL params
  React.useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error && message) {
      // Don't show error for 'no_code' errors that happen during OAuth flow
      if (error !== 'no_code') {
        addToast({
          type: 'error',
          title: 'Authentication failed',
          description: decodeURIComponent(message),
        })
      }

      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, addToast])

  // Get redirect URL from search params or use default
  const finalRedirectTo = searchParams.get('redirect') || redirectTo

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
        router.push(finalRedirectTo)
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
    <div className='relative'>
      {/* Background decoration */}
      <div className='absolute inset-0 -z-10'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 krea-gradient-blue rounded-full opacity-10 blur-3xl'></div>
        <div className='absolute bottom-0 right-1/2 translate-x-1/2 w-80 h-80 krea-gradient-purple rounded-full opacity-10 blur-3xl'></div>
      </div>

      <Card className='w-full max-w-md mx-auto backdrop-blur-sm bg-white/95 border-0 shadow-2xl'>
        <CardHeader className='space-y-4 text-center pb-8'>
          <div className='mx-auto w-16 h-16 krea-gradient-blue rounded-2xl flex items-center justify-center mb-2'>
            <Sparkles className='w-8 h-8 text-white' />
          </div>
          <CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            Welcome Back
          </CardTitle>
          <CardDescription className='text-base text-gray-600'>
            Sign in to access your creative gallery
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <label
                htmlFor='email'
                className='text-sm font-semibold text-gray-700'
              >
                Email Address
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='password'
                className='text-sm font-semibold text-gray-700'
              >
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full h-12 krea-gradient-blue text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none'
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <SocialAuthSection disabled={isLoading} showDivider={true} />

          <div className='text-center'>
            <span className='text-gray-600'>Don't have an account? </span>
            <Button
              variant='link'
              className='p-0 h-auto font-semibold text-blue-600 hover:text-blue-700 transition-colors'
              onClick={() => router.push('/signup')}
              disabled={isLoading}
            >
              Create one now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
