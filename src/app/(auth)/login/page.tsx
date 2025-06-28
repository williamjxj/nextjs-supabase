import { AuthGuard } from '@/components/auth/auth-guard'
import { LoginForm } from '@/components/auth/login-form'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function LoginPageContent() {
  return (
    <AuthGuard requireAuth={false} redirectTo='/gallery'>
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <LoginForm />
        </div>
      </div>
    </AuthGuard>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4'>
          <LoadingSpinner
            size='lg'
            variant='gradient'
            text='Loading login...'
          />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
