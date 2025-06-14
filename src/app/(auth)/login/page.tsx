import { AuthGuard } from '@/components/auth/auth-guard'
import { LoginForm } from '@/components/auth/login-form'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function LoginPageContent() {
  return (
    <AuthGuard requireAuth={false} redirectTo='/gallery'>
      <div className='min-h-screen flex items-center justify-center p-4'>
        <LoginForm />
      </div>
    </AuthGuard>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center p-4'>
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
