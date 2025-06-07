import { AuthGuard } from '@/components/auth/auth-guard'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo='/gallery'>
      <div className='min-h-screen flex items-center justify-center p-4'>
        <LoginForm />
      </div>
    </AuthGuard>
  )
}
