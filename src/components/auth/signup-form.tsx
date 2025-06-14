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
import { SignupFormData } from '@/types/auth'
import { Chrome, Facebook } from 'lucide-react' // Assuming lucide-react for icons
import { SocialAuthSection } from './social-auth'

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

  const router = useRouter()
  const { signUp, signInWithSocial } = useAuth() // Updated to include signInWithSocial
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

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Create account</CardTitle>
        <CardDescription className='text-center'>
          Enter your details to create your gallery account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='fullName' className='text-sm font-medium'>
              Full Name
            </label>
            <Input
              id='fullName'
              name='fullName'
              type='text'
              placeholder='Enter your full name'
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

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
              placeholder='Create a password (min. 6 characters)'
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='confirmPassword' className='text-sm font-medium'>
              Confirm Password
            </label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              placeholder='Confirm your password'
              value={formData.confirmPassword}
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <SocialAuthSection disabled={isLoading} showDivider={true} />

        <div className='mt-4 text-center text-sm'>
          <span className='text-muted-foreground'>
            Already have an account?{' '}
          </span>
          <Button
            variant='link'
            className='p-0 h-auto font-normal'
            onClick={() => router.push('/login')}
            disabled={isLoading}
          >
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
