'use client'

import type React from 'react'
import { useState } from 'react'
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
import type { SignupFormData } from '@/types/auth'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Check, X } from 'lucide-react'

interface SignupFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export const SignupForm = ({
  onSuccess,
  redirectTo = '/gallery',
}: SignupFormProps) => {
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()
  const { signUp } = useAuth()
  const { addToast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return 'All fields are required'
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: validationError,
      })
      return
    }

    setIsLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.fullName)
      addToast({
        type: 'success',
        title: 'Account created successfully',
        description: 'Please check your email to verify your account',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Signup failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred during signup',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isValid =
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword

  // Password strength indicators
  const passwordRequirements = [
    { label: 'At least 6 characters', met: formData.password.length >= 6 },
    {
      label: 'Passwords match',
      met:
        formData.password === formData.confirmPassword &&
        formData.confirmPassword.length > 0,
    },
  ]

  return (
    <div className='relative'>
      {/* Background decoration */}
      <div className='absolute inset-0 -z-10'>
        <div className='absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 krea-gradient-purple rounded-full opacity-10 blur-3xl'></div>
        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 krea-gradient-blue rounded-full opacity-10 blur-3xl'></div>
      </div>

      <Card className='w-full max-w-md mx-auto backdrop-blur-sm bg-white/95 border-0 shadow-2xl'>
        <CardHeader className='space-y-4 text-center pb-8'>
          <div className='mx-auto w-16 h-16 krea-gradient-purple rounded-2xl flex items-center justify-center mb-2'>
            <Sparkles className='w-8 h-8 text-white' />
          </div>
          <CardTitle className='text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
            Join Us Today
          </CardTitle>
          <CardDescription className='text-base text-gray-600'>
            Create your account and start building your gallery
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <label
                htmlFor='fullName'
                className='text-sm font-semibold text-gray-700'
              >
                Full Name
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='fullName'
                  name='fullName'
                  type='text'
                  placeholder='Enter your full name'
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-11 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200'
                />
              </div>
            </div>

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
                  className='pl-11 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200'
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
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className='pl-11 pr-11 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200'
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

            <div className='space-y-2'>
              <label
                htmlFor='confirmPassword'
                className='text-sm font-semibold text-gray-700'
              >
                Confirm Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='pl-11 pr-11 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            {(formData.password || formData.confirmPassword) && (
              <div className='space-y-2'>
                <p className='text-sm font-medium text-gray-700'>
                  Password Requirements:
                </p>
                <div className='space-y-1'>
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm'
                    >
                      {req.met ? (
                        <Check className='w-4 h-4 text-green-500' />
                      ) : (
                        <X className='w-4 h-4 text-gray-400' />
                      )}
                      <span
                        className={req.met ? 'text-green-600' : 'text-gray-500'}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type='submit'
              className='w-full h-12 krea-gradient-purple text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none'
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className='text-center'>
            <span className='text-gray-600'>Already have an account? </span>
            <Button
              variant='link'
              className='p-0 h-auto font-semibold text-purple-600 hover:text-purple-700 transition-colors'
              onClick={() => router.push('/login')}
              disabled={isLoading}
            >
              Sign in instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
