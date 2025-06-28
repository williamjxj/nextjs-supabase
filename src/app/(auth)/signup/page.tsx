import { AuthGuard } from '@/components/auth/auth-guard'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo='/gallery'>
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <SignupForm />
        </div>
      </div>
    </AuthGuard>
  )
}
