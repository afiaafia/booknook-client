'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  LoaderCircle,
  RotateCcw,
  Library,
  BookCheck,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';

import { getMyBorrows, returnBorrow, type Borrow } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface BorrowListState {
  requestKey: string;
  borrows: Borrow[];
  error?: string;
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-9">
      <div className="h-56 rounded-2xl bg-surface-secondary" />

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 rounded-2xl bg-surface-secondary" />
        ))}
      </div>

      <div className="space-y-5">
        <div className="h-8 w-56 rounded bg-surface-secondary" />
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="h-64 rounded-2xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof BookOpen;
  accent: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-[#FBF8F1] dark:bg-surface p-5 shadow-[0_5px_20px_rgba(61,46,27,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(61,46,27,0.08)] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {label}
          </p>

          <p className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            {String(value).padStart(2, '0')}
          </p>

          <p className="mt-2 text-xs text-muted">{description}</p>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-brass/20">
        <div className="h-full w-1/3 bg-brass transition-all duration-500 group-hover:w-full" />
      </div>
    </article>
  );
}

function BorrowCard({
  borrow,
  isReturning,
  returnDisabled,
  onReturn,
  isHistory = false,
}: {
  borrow: Borrow;
  isReturning: boolean;
  returnDisabled: boolean;
  onReturn: (borrowId: string) => void;
  isHistory?: boolean;
}) {
  const isActive = borrow.status === 'active';

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-[#FBF8F1] dark:bg-surface shadow-[0_5px_20px_rgba(61,46,27,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_14px_32px_rgba(61,46,27,0.09)]">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <Link
          href={`/books/${encodeURIComponent(borrow.bookId)}`}
          aria-label={`View ${borrow.bookTitle}`}
          className="relative h-[150px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-surface-secondary shadow-[4px_5px_12px_rgba(54,42,28,0.15)] transition-transform duration-300 group-hover:-rotate-1 sm:h-[166px] sm:w-[114px]"
        >
          <Image
            src={borrow.bookImage}
            alt={`Cover of ${borrow.bookTitle}`}
            loading="lazy"
            fill
            unoptimized
            sizes="114px"
            className="object-cover"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-brass">
              {isHistory ? 'Reading archive' : 'Currently reading'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                isActive
                  ? 'border-brass/35 bg-brass/10 text-brass'
                  : 'border-status-success/30 bg-status-success/10 text-status-success'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-brass' : 'bg-status-success'
                }`}
              />
              {isActive ? 'Active' : 'Returned'}
            </span>
          </div>

          <Link
            href={`/books/${encodeURIComponent(borrow.bookId)}`}
            className="mt-3 line-clamp-2 font-serif text-lg leading-snug text-foreground transition-colors hover:text-brass sm:text-xl"
          >
            {borrow.bookTitle}
          </Link>

          <div className="mt-auto space-y-2 pt-4 text-[11px] text-muted">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brass" />
              <span>Borrowed {formatDate(borrow.borrowDate)}</span>
            </p>

            {isActive ? (
              <p className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-brass" />
                <span>Return by {formatDate(borrow.returnDate)}</span>
              </p>
            ) : borrow.returnedAt ? (
              <p className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 shrink-0 text-status-success" />
                <span>Returned {formatDate(borrow.returnedAt)}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-[#FBF8F1] dark:bg-surface px-4 py-3 sm:px-5">
        {isActive ? (
          <>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Your current loan
            </span>

            <button
              type="button"
              onClick={() => onReturn(borrow._id)}
              disabled={returnDisabled}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReturning ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              {isReturning ? 'Returning...' : 'Return book'}
            </button>
          </>
        ) : (
          <>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Completed borrowing
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-status-success">
              <BookCheck className="h-3.5 w-3.5" />
              Completed
            </span>
          </>
        )}
      </div>
    </article>
  );
}

function BorrowSection({
  eyebrow,
  title,
  description,
  borrows,
  emptyMessage,
  returningId,
  onReturn,
  isHistory = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  borrows: Borrow[];
  emptyMessage: string;
  returningId: string | null;
  onReturn: (borrowId: string) => void;
  isHistory?: boolean;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-brass">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {title}
            <span className="text-brass">.</span>
          </h2>

          <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
            {description}
          </p>
        </div>

        <span className="rounded-full border border-border bg-[#FBF8F1] dark:bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brass">
          {String(borrows.length).padStart(2, '0')}{' '}
          {borrows.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      {borrows.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {borrows.map((borrow) => (
            <BorrowCard
              key={borrow._id}
              borrow={borrow}
              isReturning={returningId === borrow._id}
              returnDisabled={returningId !== null}
              onReturn={onReturn}
              isHistory={isHistory}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-[#FBF8F1] dark:bg-surface px-6 py-12 text-center sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary">
            {isHistory ? (
              <Bookmark className="h-6 w-6 text-brass" strokeWidth={1.3} />
            ) : (
              <BookOpen className="h-6 w-6 text-brass" strokeWidth={1.3} />
            )}
          </div>

          <h3 className="mt-5 font-serif text-xl text-foreground">
            {isHistory ? 'Your reading archive is waiting.' : 'Ready for your next read?'}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted">
            {emptyMessage}
          </p>

          {!isHistory && (
            <Link
              href="/books"
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition hover:bg-primary-dark"
            >
              Explore the library
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function BorrowingDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [reloadCount, setReloadCount] = useState(0);
  const [returningId, setReturningId] = useState<string | null>(null);
  const returnInFlight = useRef(false);

  const sessionUserId = session?.user.id;
  const requestKey = `${sessionUserId ?? ''}:${reloadCount}`;

  const [borrowListState, setBorrowListState] =
    useState<BorrowListState | null>(null);

  const currentBorrowList =
    borrowListState?.requestKey === requestKey ? borrowListState : null;

  const borrows = currentBorrowList?.borrows ?? [];
  const error = currentBorrowList?.error ?? null;
  const isLoading = isPending || !session || currentBorrowList === null;

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/sign-in');
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (isPending || !sessionUserId) return;

    let active = true;

    getMyBorrows()
      .then((result) => {
        if (active) {
          setBorrowListState({ requestKey, borrows: result });
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;

        setBorrowListState({
          requestKey,
          borrows: [],
          error:
            requestError instanceof Error
              ? requestError.message
              : "We couldn't load your borrowing history.",
        });
      });

    return () => {
      active = false;
    };
  }, [isPending, sessionUserId, reloadCount, requestKey]);

  async function handleReturn(borrowId: string) {
    if (returnInFlight.current) return;

    returnInFlight.current = true;
    setReturningId(borrowId);

    try {
      await returnBorrow(borrowId);
      toast.success('Book returned successfully.');
      setReloadCount((count) => count + 1);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "We couldn't return this book. Try again."
      );
    } finally {
      returnInFlight.current = false;
      setReturningId(null);
    }
  }

  if (isPending || !session) {
    return (
      <main className="min-h-[calc(100vh-68px)] bgbackground px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  const activeBorrows = borrows.filter((borrow) => borrow.status === 'active');
  const returnedBorrows = borrows.filter((borrow) => borrow.status === 'returned');

  return (
    <main className="min-h-[calc(100vh-68px)] bgbackground text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">

        {/* HERO SECTION */}
        <header className="relative overflow-hidden rounded-3xl border border-border bg-[#F8F5EE] dark:bg-surface px-6 py-8 shadow-[0_10px_35px_rgba(61,46,27,0.045)] sm:px-10 sm:py-11">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-px w-7 bg-brass" />
              <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-brass">
                Your personal library
              </p>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
              <div>
                <h1 className="font-serif text-[42px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
                  My Borrows<span className="text-brass">.</span>
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                  Keep track of the books you are reading, manage your current
                  loans, and revisit the stories you have returned.
                </p>

                <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.15em] text-brass">
                  {session.user.name || 'Reader'}
                  <span className="mx-2 textborder">/</span>
                  BookNook member
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/books"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted transition hover:border-brass hover:bg-surface-secondary"
                >
                  My Books
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/books"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[10px] font-semibold uppercase tracking-[0.09em] text-primary-foreground transition hover:bg-primary-dark"
                >
                  Explore Library
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* OVERVIEW CARDS */}
        {!isLoading && !error && (
          <section aria-label="Borrowing overview" className="mt-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-6 bg-brass" />
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                Your borrowing overview
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Currently with you"
                value={activeBorrows.length}
                description="Books currently borrowed"
                icon={BookOpen}
                accent="bg-surface-secondary text-brass"
              />

              <SummaryCard
                label="Stories completed"
                value={returnedBorrows.length}
                description="Books successfully returned"
                icon={BookCheck}
                accent="bg-surface-secondary text-status-success"
              />

              <SummaryCard
                label="Your reading record"
                value={borrows.length}
                description="Total borrowing records"
                icon={Library}
                accent="bg-surface-secondary text-muted"
              />
            </div>
          </section>
        )}

        {/* MAIN CONTENT */}
        {isLoading ? (
          <div className="pt-10">
            <DashboardSkeleton />
          </div>
        ) : error ? (
          <section className="mt-10 rounded-2xl border border-border bg-[#FBF8F1] dark:bg-surface px-6 py-14 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-brass" strokeWidth={1.2} />

            <h2 className="mt-4 font-serif text-2xl text-foreground">
              Borrowing history unavailable
            </h2>

            <p className="mt-2 text-sm text-muted">{error}</p>

            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition hover:bg-primary-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </section>
        ) : (
          <div className="pt-11 sm:pt-14">
            <BorrowSection
              eyebrow="01 / Current reading"
              title="Currently Borrowed"
              description="Your active loans, all in one place. Return a book when you are finished."
              borrows={activeBorrows}
              emptyMessage="You don't have any active borrows right now. Browse the library and find your next favourite read."
              returningId={returningId}
              onReturn={handleReturn}
            />

            <div className="my-12 border-t border-border" />

            <BorrowSection
              eyebrow="02 / The archive"
              title="Returned Books"
              description="A collection of the books you've finished and returned."
              borrows={returnedBorrows}
              emptyMessage="Your returned books will appear here. Every completed loan becomes part of your reading history."
              returningId={returningId}
              onReturn={handleReturn}
              isHistory
            />
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-16 flex items-center justify-center gap-3 border-t border-border pt-7">
          <span className="h-px w-8 bg-brass/50" />
          <p className="font-serif text-xs italic text-muted">
            Every borrowed book holds a story.
          </p>
          <span className="h-px w-8 bg-brass/50" />
        </footer>
      </div>
    </main>
  );
}
