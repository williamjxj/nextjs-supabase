'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const getErrorInfo = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          description:
            'You cancelled the authentication process or denied access to your account.',
          suggestion:
            'Please try signing in again and allow the necessary permissions.',
        }
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'There was a problem with the authentication server.',
          suggestion:
            'Please try again in a few moments. If the problem persists, contact support.',
        }
      case 'temporarily_unavailable':
        return {
          title: 'Service Temporarily Unavailable',
          description: 'The authentication service is temporarily unavailable.',
          suggestion: 'Please try again in a few minutes.',
        }
      case 'session_error':
        return {
          title: 'Session Error',
          description: 'There was a problem establishing your session.',
          suggestion: 'Please try signing in again.',
        }
      case 'callback_error':
        return {
          title: 'Authentication Failed',
          description: 'There was a problem processing your authentication.',
          suggestion: 'Please try signing in again.',
        }
      case 'no_code':
        return {
          title: 'Invalid Authentication',
          description: 'The authentication request was invalid or incomplete.',
          suggestion: 'Please start the sign-in process again.',
        }
      default:
        return {
          title: 'Authentication Error',
          description:
            message || 'An unknown error occurred during authentication.',
          suggestion: 'Please try signing in again.',
        }
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center'>
            <AlertTriangle className='w-8 h-8 text-destructive' />
          </div>
          <CardTitle className='text-xl'>{errorInfo.title}</CardTitle>
          <CardDescription className='text-center'>
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='p-4 bg-muted rounded-lg'>
            <p className='text-sm text-muted-foreground'>
              {errorInfo.suggestion}
            </p>
          </div>

          {message && (
            <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
              <p className='text-xs text-destructive font-mono break-all'>
                {message}
              </p>
            </div>
          )}

          <div className='flex flex-col gap-3'>
            <Link href='/login'>
              <Button className='w-full'>Try Again</Button>
            </Link>

            <Link href='/'>
              <Button variant='outline' className='w-full'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4' />
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
