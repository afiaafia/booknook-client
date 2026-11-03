import { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthPage from '@/components/auth/auth-page';

export const metadata: Metadata = { title: 'Register' };

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthPage mode="sign-up" />
    </Suspense>
  );
}
