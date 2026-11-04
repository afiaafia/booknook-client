'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  LoaderCircle,
  LogOut,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { signIn, signOut, signUp, useSession } from '@/lib/auth-client';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const isSignUp = mode === 'sign-up';
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl =
    searchParams.get('next') || searchParams.get('callbackUrl') || '/dashboard';

  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Password criteria checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error('Enter a valid email address.');
      return;
    }

    if (isSignUp && !name.trim()) {
      toast.error('Enter your name to create an account.');
      return;
    }

    if (isSignUp && photoUrl.trim()) {
      try {
        const parsedPhotoUrl = new URL(photoUrl.trim());
        if (!['http:', 'https:'].includes(parsedPhotoUrl.protocol)) {
          throw new Error('Invalid photo URL');
        }
      } catch {
        toast.error('Enter a valid profile photo URL.');
        return;
      }
    }

    if (isSignUp) {
      if (!isPasswordValid) {
        toast.error(
          'Password must have at least 8 characters, an uppercase letter, a lowercase letter, and a number.'
        );
        return;
      }
    } else {
      if (!password) {
        toast.error('Please enter your password.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = isSignUp
        ? await signUp.email({
            name: name.trim(),
            email: normalizedEmail,
            password,
            image: photoUrl.trim() || undefined,
          })
        : await signIn.email({ email: normalizedEmail, password });

      if (result.error) {
        toast.error(result.error.message || 'Authentication failed.');
        return;
      }

      toast.success(isSignUp ? 'Your account is ready.' : 'Welcome back.');
      router.replace(nextUrl);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to authenticate. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
      const result = await signIn.social({
        provider: 'google',
        callbackURL: nextUrl,
      });

      if (result?.error) {
        toast.error(
          result.error.message ||
            'Google sign-in is not configured yet. Please use email and password.'
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Google sign-in is not available. Please sign in with email and password.'
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await signOut();
      if (result.error) {
        toast.error(result.error.message || 'Unable to sign out.');
        return;
      }

      toast.success('You have signed out.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to sign out.'
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side: Brand & Atmosphere */}
        <section className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-primary px-6 py-7 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-12 h-52 w-52 rounded-full border border-white/10" />

          <Link
            href="/"
            className="relative inline-flex w-fit items-center gap-2.5"
          >
            <BookOpen className="h-7 w-7" aria-hidden="true" />
            <span className="text-xl font-semibold">BookNook</span>
          </Link>

          <div className="relative max-w-lg py-10 lg:py-0">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-white/70">
              Your next chapter starts here
            </p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight sm:text-5xl">
              A little more room for the stories you love.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/75">
              Find a new favorite, keep your reading close, and make every visit
              to the library feel like coming home.
            </p>
          </div>

          <Link
            href="/"
            className="relative inline-flex w-fit items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </Link>
        </section>

        {/* Right Side: Auth Forms */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            {session ? (
              <div className="rounded-sm border border-border bg-surface p-7 shadow-sm sm:p-9">
                <p className="text-sm font-medium text-primary">
                  You're signed in signed in
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Welcome, {session.user.name || session.user.email}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Continue to your intended destination or sign out to use
                  another account.
                </p>
                <Link
                  href={nextUrl}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 font-medium text-white transition hover:bg-primary-dark"
                >
                  Continue
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-medium transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-primary">
                  {isSignUp ? 'Join the reading room' : 'Welcome back'}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {isSignUp ? 'Create your account' : 'Sign in to BookNook'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {isSignUp
                    ? 'Set up your account and start exploring the collection.'
                    : 'Your next great read is just around the corner.'}
                </p>

                {/* Google Sign In Button */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSubmitting || isSubmitting}
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-sm border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGoogleSubmitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-6 text-center text-xs text-muted">
                    <span className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </span>
                    <span className="relative bg-background px-3 uppercase tracking-wider">
                      Or with email
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  noValidate
                >
                  {isSignUp && (
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        placeholder="e.g., Emily Dickinson"
                      />
                    </div>
                  )}

                  {isSignUp && (
                    <div className="space-y-2">
                      <label htmlFor="photoUrl" className="text-sm font-medium">
                        Profile Photo URL <span className="text-muted">(Optional)</span>
                      </label>
                      <input
                        id="photoUrl"
                        name="photoUrl"
                        type="url"
                        autoComplete="url"
                        value={photoUrl}
                        onChange={(event) => setPhotoUrl(event.target.value)}
                        className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                      <p className="text-xs text-muted">
                        Add a direct link to your profile picture. You can also leave this empty.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        isSignUp ? 'new-password' : 'current-password'
                      }
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder={
                        isSignUp
                          ? 'At least 8 chars with uppercase, lowercase, number'
                          : 'Enter your password'
                      }
                    />

                    {/* Live Password Checklist for Registration */}
                    {isSignUp && password.length > 0 && (
                      <div className="rounded-sm border border-border bg-surface p-3 text-xs space-y-1.5 mt-2">
                        <p className="font-semibold text-muted">Password requirements:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-primary' : 'text-muted'}`}>
                            {hasMinLength ? <Check size={13} /> : <X size={13} />}
                            8+ characters
                          </span>
                          <span className={`inline-flex items-center gap-1 ${hasUppercase ? 'text-primary' : 'text-muted'}`}>
                            {hasUppercase ? <Check size={13} /> : <X size={13} />}
                            Uppercase letter
                          </span>
                          <span className={`inline-flex items-center gap-1 ${hasLowercase ? 'text-primary' : 'text-muted'}`}>
                            {hasLowercase ? <Check size={13} /> : <X size={13} />}
                            Lowercase letter
                          </span>
                          <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-primary' : 'text-muted'}`}>
                            {hasNumber ? <Check size={13} /> : <X size={13} />}
                            Number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3.5 font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        {isSignUp ? 'Create account' : 'Sign in'}
                        <ArrowRight size={17} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-muted">
                  {isSignUp ? 'Already have an account?' : 'New to BookNook?'}{' '}
                  <Link
                    href={
                      isSignUp
                        ? `/sign-in${nextUrl !== '/dashboard' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`
                        : `/sign-up${nextUrl !== '/dashboard' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`
                    }
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {isSignUp ? 'Sign in' : 'Create an account'}
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
