'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { signOut, useSession } from '@/lib/auth-client';
import ThemeToggle from '@/components/theme-toggle';

export default function SiteNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        toast.error(result.error.message || "We couldn't sign you out.");
        return;
      }

      toast.success('You have signed out.');
      setIsMobileMenuOpen(false);
      router.replace('/');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "We couldn't sign you out."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  const navigationLinks = session
    ? [
        { label: 'Home', href: '/' },
        { label: 'All Books', href: '/books' },
        { label: 'Add Book', href: '/dashboard/books/new' },
        { label: 'My Books', href: '/dashboard/books' },
        { label: 'My Borrows', href: '/dashboard' },
      ]
    : [
        { label: 'Home', href: '/' },
        { label: 'All Books', href: '/books' },
      ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/';

    if (href === '/books') {
      return pathname === '/books' || pathname.startsWith('/books/');
    }

    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    if (href === '/dashboard/books/new') {
      return (
        pathname === '/dashboard/books/new' ||
        pathname.startsWith('/dashboard/books/new/')
      );
    }

    if (href === '/dashboard/books') {
      return (
        (pathname === '/dashboard/books' ||
          pathname.startsWith('/dashboard/books/')) &&
        !pathname.startsWith('/dashboard/books/new')
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(href: string) {
    return `relative px-2 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.11em] transition after:absolute after:inset-x-2 after:bottom-0 after:h-px after:origin-left after:bg-primary after:transition-transform ${
      isActive(href)
        ? 'text-primary after:scale-x-100'
        : 'text-muted after:scale-x-0 hover:text-primary hover:after:scale-x-100'
    }`;
  }

  return (
    <header className="relative z-20 border-b border-border bg-background">
      <nav className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-3"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="flex h-10 w-9 items-center justify-center border border-primary">
            <Image
              src="/images/booknook-logo.png"
              alt="BookNook logo"
              width={24}
              height={24}
              priority
              className="h-6 w-6 object-contain"
            />
          </span>
          <span className="block">
            <span className="block font-serif text-[1.65rem] font-semibold leading-none text-foreground">
              BookNook
            </span>
            <span className="mt-1 block text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-secondary-accent">
              The Modern Bindery
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-4 lg:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle />
          {isPending ? (
            <span className="h-9 w-28 animate-pulse border-b border-border bg-surface" />
          ) : session ? (
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-sm font-medium transition hover:border-primary [&::-webkit-details-marker]:hidden">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={30}
                    height={30}
                    unoptimized
                    className="h-[30px] w-[30px] rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-surface-secondary text-primary">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                <span className="max-w-32 truncate">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown
                  className="h-4 w-4 text-muted transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-sm border border-border bg-surface p-2 shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-semibold">
                    {session.user.name || 'BookNook reader'}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {session.user.email}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="mt-1 block rounded-sm px-3 py-2.5 text-sm hover:bg-background"
                >
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm text-status-danger hover:bg-status-danger/10 disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  Logout
                </button>
              </div>
            </details>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-muted transition hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-10 items-center border border-primary px-4 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <ThemeToggle />

          <button
            type="button"
            aria-label={
              isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-site-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border text-foreground transition hover:border-primary hover:text-primary lg:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          id="mobile-site-navigation"
          className="absolute inset-x-0 top-full border-b border-border bg-surface px-5 py-4 shadow-[0_16px_34px_rgb(var(--shadow-color)/0.12)] lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
                        {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                  className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            {isPending ? (
              <div className="my-2 h-10 animate-pulse rounded bg-background" />
            ) : session ? (
              <>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border-b border-border/70 px-3 py-3 text-sm font-medium transition hover:text-primary"
                >
                  My Profile
                </Link>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                  <span className="max-w-[65%] truncate text-sm text-muted">
                    {session.user.name || session.user.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm font-medium transition hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    {isSigningOut ? (
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                    )}
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border border-border px-4 py-3 text-center text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border border-primary bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
