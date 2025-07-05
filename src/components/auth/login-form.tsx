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
        <CardHeader className='space-y-3 text-center pb-5'>
          <div className='mx-auto w-12 h-12 krea-gradient-blue rounded-xl flex items-center justify-center mb-1'>
            <Sparkles className='w-6 h-6 text-white' />
          </div>
          <CardTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            Welcome Back
          </CardTitle>
          <CardDescription className='text-sm text-gray-600'>
            Sign in to access your creative gallery
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <label
                htmlFor='email'
                className='text-sm font-semibold text-gray-700'
              >
                Email Address
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200'
                />
              </div>
            </div>

            <div className='space-y-1'>
              <label
                htmlFor='password'
                className='text-sm font-semibold text-gray-700'
              >
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-10 pr-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full h-10 krea-gradient-blue text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none'
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

          {/* Testing Tips Section */}
          <div className='bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200/60 rounded-lg p-3 shadow-sm'>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <div className='w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>🧪</span>
                </div>
                <h4 className='text-xs font-semibold text-gray-700'>
                  Demo Accounts
                </h4>
              </div>
              <div className='space-y-2'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
                  <div className='flex items-center gap-2'>
                    <div className='w-1.5 h-1.5 bg-orange-400 rounded-full'></div>
                    <span className='font-mono text-xs text-gray-700 font-medium'>
                      demo1@example.com / 123456
                    </span>
                  </div>
                  <span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium'>
                    No subscription
                  </span>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
                  <div className='flex items-center gap-2'>
                    <div className='w-1.5 h-1.5 bg-green-400 rounded-full'></div>
                    <span className='font-mono text-xs text-gray-700 font-medium'>
                      demo2@example.com / 123456
                    </span>
                  </div>
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium'>
                    Premium member
                  </span>
                </div>
              </div>
              <p className='text-xs text-gray-500 mt-2 italic'>
                Use these accounts to test different subscription states
              </p>
            </div>
          </div>

          <div className='pt-2'>
            <SocialAuthSection disabled={isLoading} showDivider={true} />
          </div>

          <div className='text-center'>
            <span className='text-gray-600'>Don&apos;t have an account? </span>
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
