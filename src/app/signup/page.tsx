import { AuthGuard } from "@/components/auth/auth-guard";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/gallery">
      <div className="min-h-screen flex items-center justify-center p-4">
        <SignupForm />
      </div>
    </AuthGuard>
  );
}
