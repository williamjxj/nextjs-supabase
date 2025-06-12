import { AuthGuard } from '@/components/auth/auth-guard'
import { LoginForm } from '@/components/auth/login-form'
import { Suspense } from 'react'

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
          <div>Loading...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
