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

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-28 rounded-sm bg-surface-secondary" />
      {[0, 1].map((section) => (
        <section key={section}>
          <div className="mb-4 h-6 w-40 rounded bg-border" />
          <div className="space-y-3">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="flex gap-4 rounded-sm border border-border bg-surface p-4"
              >
                <div className="h-24 w-16 shrink-0 rounded bg-surface-secondary" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 w-2/3 rounded bg-border" />
                  <div className="h-4 w-1/2 rounded bg-border" />
                  <div className="h-4 w-3/4 rounded bg-border" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface BorrowListState {
  requestKey: string;
  borrows: Borrow[];
  error?: string;
}

function BorrowRow({
  borrow,
  isReturning,
  returnDisabled,
  onReturn,
}: {
  borrow: Borrow;
  isReturning: boolean;
  returnDisabled: boolean;
  onReturn: (borrowId: string) => void;
}) {
  const isActive = borrow.status === 'active';

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-sm border border-border bg-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <Link
        href={`/books/${encodeURIComponent(borrow.bookId)}`}
        className="flex min-w-0 items-start gap-4 sm:items-center"
      >
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-surface-secondary sm:h-28 sm:w-[74px]">
          <Image
            src={borrow.bookImage}
            alt={`Cover of ${borrow.bookTitle}`}
            loading="lazy"
            fill
            unoptimized
            sizes="74px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 py-1">
          <h3 className="line-clamp-2 font-semibold leading-6 transition hover:text-primary">
            {borrow.bookTitle}
          </h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={15} aria-hidden="true" />
            Borrowed {formatDate(borrow.borrowDate)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Return by {formatDate(borrow.returnDate)}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-3 sm:ml-auto sm:border-0 sm:pt-0">
        <span
          className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-xs font-semibold ${
            isActive ? 'bg-surface-secondary text-primary' : 'bg-background text-muted'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isActive ? 'bg-primary' : 'bg-muted'
            }`}
          />
          {isActive ? 'Active' : 'Returned'}
        </span>

        {isActive && (
          <button
            type="button"
            onClick={() => onReturn(borrow._id)}
            disabled={returnDisabled}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-border px-3.5 text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isReturning ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}
            {isReturning ? 'Returning...' : 'Return book'}
          </button>
        )}
      </div>
    </article>
  );
}

function BorrowSection({
  title,
  description,
  borrows,
  emptyMessage,
  returningId,
  onReturn,
}: {
  title: string;
  description: string;
  borrows: Borrow[];
  emptyMessage: string;
  returningId: string | null;
  onReturn: (borrowId: string) => void;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <span className="text-sm font-medium text-muted">
          {borrows.length} {borrows.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      {borrows.length > 0 ? (
        <div className="space-y-3">
          {borrows.map((borrow) => (
            <BorrowRow
              key={borrow._id}
              borrow={borrow}
              isReturning={returningId === borrow._id}
              returnDisabled={returningId !== null}
              onReturn={onReturn}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-muted">
          {emptyMessage}
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
    if (!isPending && !session) router.replace('/sign-in');
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
      <main className="min-h-[calc(100vh-68px)] bg-background px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  const activeBorrows = borrows.filter((borrow) => borrow.status === 'active');
  const returnedBorrows = borrows.filter(
    (borrow) => borrow.status === 'returned'
  );

  return (
    <main className="min-h-[calc(100vh-68px)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <section className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Your reading room
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {session.user.name || 'reader'}
            </h1>
            <p className="mt-2 text-sm text-muted">{session.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/books"
              className="inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              Book Management
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/books"
              className="inline-flex w-fit items-center gap-2 rounded-sm border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:border-primary hover:text-primary"
            >
              Browse Books
            </Link>
          </div>
        </section>

        {!isLoading && !error && (
          <section
            aria-label="Borrowing summary"
            className="mt-7 grid gap-3 sm:grid-cols-2"
          >
            <article className="flex items-center justify-between rounded-sm border border-border bg-surface p-5">
              <div>
                <p className="text-sm font-medium text-muted">Active borrows</p>
                <p className="mt-2 text-3xl font-semibold">
                  {activeBorrows.length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
            </article>
            <article className="flex items-center justify-between rounded-sm border border-border bg-surface p-5">
              <div>
                <p className="text-sm font-medium text-muted">Returned books</p>
                <p className="mt-2 text-3xl font-semibold">
                  {returnedBorrows.length}
                </p>
              </div>
              <RotateCcw className="h-8 w-8 text-muted" aria-hidden="true" />
            </article>
          </section>
        )}

        {isLoading ? (
          <div className="pt-9">
            <DashboardSkeleton />
          </div>
        ) : error ? (
          <section className="mt-9 rounded-sm border border-border bg-surface px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">
              Borrowing history unavailable
            </h2>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="mt-5 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Try again
            </button>
          </section>
        ) : (
          <div className="pt-9">
            <BorrowSection
              title="Currently borrowed"
              description="Books you still have checked out."
              borrows={activeBorrows}
              emptyMessage="You don't have any active borrows. Find something good to read."
              returningId={returningId}
              onReturn={handleReturn}
            />
            <BorrowSection
              title="Returned books"
              description="Your completed reading history."
              borrows={returnedBorrows}
              emptyMessage="Returned books will appear here."
              returningId={returningId}
              onReturn={handleReturn}
            />
          </div>
        )}
      </div>
    </main>
  );
}
