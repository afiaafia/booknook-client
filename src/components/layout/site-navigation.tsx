'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  LogOut,
  UserRound,
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handleOutsideClick(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

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
    return `relative rounded-full px-3 py-2 text-[0.75rem] font-medium tracking-wide transition-all duration-300
      after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-1
      after:h-[1.5px] after:origin-left after:scale-x-0
      after:bg-[#B18A4A] dark:after:bg-[#CFB274]
      after:transition-transform after:duration-300 after:ease-out
      hover:after:scale-x-100 ${
        isActive(href)
          ? 'bg-[#6B4B36]/10 text-[#4A3024] after:scale-x-100 dark:bg-white/10 dark:text-[#F7EBDD]'
          : 'text-[#765B49] hover:bg-[#6B4B36]/5 hover:text-[#4A3024] dark:text-[#C9B29B] dark:hover:bg-white/5 dark:hover:text-[#F7EBDD]'
      }`;
  }

  return (
    <header
      className="relative z-20 bg-transparent px-4 pt-4 sm:px-8"
    >
      <nav
        className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 rounded-2xl border border-[#765B49]/15 px-4 shadow-[0_12px_40px_rgba(65,45,30,0.10)] backdrop-blur-2xl dark:border-[#F5E8D4]/20 dark:shadow-[0_12px_40px_rgba(20,12,8,0.18)] sm:px-7"
      style={{
        backgroundColor: 'var(--guest-nav-bg)',
        borderColor: 'var(--guest-nav-border)',
        boxShadow: 'var(--guest-nav-shadow)',
      }}
      >
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-3"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B4B36]/10 dark:bg-white/10"
          >
            <Image
              src="/images/booknook-logo.png"
              alt="BookNook logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
          </span>
          <span className="block">
            <span
              className="booknook-formal-script text-[34px] leading-none text-[#4A3024] dark:text-[#F7EBDD]"
            >
              BookNook
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
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-label="Open profile menu"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#765B49]/20 bg-[#F5EBDD]/70 px-3 text-sm font-medium text-[#4A3024] transition hover:bg-[#6B4B36]/10 dark:border-[#F5E8D4]/20 dark:bg-white/5 dark:text-[#F7EBDD] dark:hover:bg-white/10"
              >
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
                  className={`h-4 w-4 text-muted transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-[#765B49]/20 bg-[#F8F2E8]/85 p-2 shadow-[0_18px_50px_rgba(65,45,30,0.18)] backdrop-blur-2xl transition-all duration-200 dark:border-[#F5E8D4]/20 dark:bg-[#30251F]/80 dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-[#6B4B36]/[0.07] px-3 py-3 dark:bg-white/[0.06]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B18A4A]/30 bg-[#E9DCCB] text-[#654632] dark:border-[#CFB274]/30 dark:bg-white/10 dark:text-[#E8D4B8]">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#4A3024] dark:text-[#F7EBDD]">
                        {session.user.name || 'BookNook Reader'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#806C5C] dark:text-[#C9B29B]">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="my-2 h-px bg-[#765B49]/15 dark:bg-[#F5E8D4]/15" />

                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4A3024] transition-all duration-200 hover:bg-[#6B4B36]/10 dark:text-[#F7EBDD] dark:hover:bg-white/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6B4B36]/10 text-[#76513A] transition-colors group-hover:bg-[#6B4B36]/15 dark:bg-white/[0.07] dark:text-[#CFB274] dark:group-hover:bg-white/[0.12]">
                      <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="flex-1">My Profile</span>
                    <ChevronRight className="h-4 w-4 text-[#9A826D] transition-transform duration-200 group-hover:translate-x-0.5 dark:text-[#C9B29B]" aria-hidden="true" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleSignOut();
                    }}
                    disabled={isSigningOut}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#9C4945] transition-all duration-200 hover:bg-[#9C4945]/[0.08] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#E39B96] dark:hover:bg-[#E39B96]/[0.08]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9C4945]/[0.08] text-[#9C4945] transition-colors group-hover:bg-[#9C4945]/[0.14] dark:bg-[#E39B96]/[0.10] dark:text-[#E39B96] dark:group-hover:bg-[#E39B96]/[0.16]">
                      {isSigningOut ? (
                        <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
                      ) : (
                        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                      )}
                    </span>
                    <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[#E9D6C0] transition-colors duration-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-10 items-center rounded-full bg-[#E9D6C0] px-5 text-[0.72rem] font-semibold tracking-wide text-[#392A23] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F5EBDD] hover:shadow-lg"
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition hover:bg-[#6B4B36]/10 hover:text-[#4A3024] dark:hover:bg-white/10 dark:hover:text-[#F7EBDD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B98C] lg:hidden"
        >
          <span
            className="relative block h-5 w-5"
            aria-hidden="true"
          >
            <span
              className={`absolute left-0 top-[4px] h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[10px] h-[1.5px] w-5 rounded-full bg-current transition-all duration-200 ease-in-out ${
                isMobileMenuOpen ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 top-[16px] h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-y-[-6px] -rotate-45' : ''
              }`}
            />
          </span>
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          id="mobile-site-navigation"
          className="absolute inset-x-0 top-full mt-3 rounded-2xl border border-[#765B49]/20 bg-[#F8F2E8]/95 px-5 py-4 shadow-[0_16px_40px_rgba(65,45,30,0.16)] backdrop-blur-2xl dark:border-[#F5E8D4]/20 dark:bg-[#30251F]/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)] lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-1">
                        {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                  className={`${linkClass(link.href)} w-fit self-start`}
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
