'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  LoaderCircle,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  borrowBook as createBorrow,
  getBook,
  getBooks,
  type Book,
} from '@/lib/api';
import { useSession } from '@/lib/auth-client';

function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const localDate = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000
  );
  return localDate.toISOString().slice(0, 10);
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function BookDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:gap-16 lg:py-16">
      <div className="mx-auto aspect-[3/4] w-full max-w-md bg-surface-secondary" />
      <div className="space-y-5 py-2">
        <div className="h-5 w-28 rounded bg-border" />
        <div className="h-10 w-4/5 rounded bg-border" />
        <div className="h-5 w-2/5 rounded bg-border" />
        <div className="h-20 rounded bg-border" />
        <div className="h-32 rounded bg-border" />
        <div className="h-12 w-48 rounded bg-border" />
      </div>
    </div>
  );
}

interface BookLoadState {
  requestKey: string;
  book: Book | null;
  error?: string;
}

export default function BookDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [bookLoadState, setBookLoadState] = useState<BookLoadState | null>(
    null
  );
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(getTomorrowDateString());
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowModalError, setBorrowModalError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const [relatedState, setRelatedState] = useState<{
    requestKey: string;
    books: Book[];
    error: boolean;
  } | null>(null);
  const borrowInFlight = useRef(false);

  const requestKey = `${id}:${reloadCount}`;
  const isValidBookId = /^[0-9a-f]{24}$/i.test(id);
  const currentBookLoad =
    bookLoadState?.requestKey === requestKey ? bookLoadState : null;
  const book = currentBookLoad?.book ?? null;
  const error = isValidBookId
    ? (currentBookLoad?.error ?? null)
    : 'Invalid book identifier.';
  const isLoading = isValidBookId && currentBookLoad === null;
  const relatedKey = `${id}:${book?.category ?? ''}`;
  const related = relatedState?.requestKey === relatedKey ? relatedState : null;
  const coverFailed = !book?.image || failedCoverUrl === book.image;

  // Private route redirect: require authentication
  useEffect(() => {
    if (!isSessionPending && !session) {
      router.replace(`/sign-in?next=${encodeURIComponent(`/books/${id}`)}`);
    }
  }, [isSessionPending, session, router, id]);

  // Fetch book details
  useEffect(() => {
    let active = true;

    if (!isValidBookId) return;

    getBook(id)
      .then((result) => {
        if (active) setBookLoadState({ requestKey, book: result });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setBookLoadState({
          requestKey,
          book: null,
          error:
            requestError instanceof Error
              ? requestError.message
              : "We couldn't load this book.",
        });
      });

    return () => {
      active = false;
    };
  }, [id, isValidBookId, reloadCount, requestKey]);

  useEffect(() => {
    if (!book) return;
    let active = true;

    getBooks({ category: book.category, page: 1, limit: 6, sort: 'newest' })
      .then(({ books }) => {
        if (!active) return;
        setRelatedState({
          requestKey: relatedKey,
          books: books.filter((item) => item._id !== book._id).slice(0, 4),
          error: false,
        });
      })
      .catch(() => {
        if (active)
          setRelatedState({ requestKey: relatedKey, books: [], error: true });
      });

    return () => {
      active = false;
    };
  }, [book, relatedKey]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isBorrowModalOpen && !isBorrowing) {
        setIsBorrowModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBorrowModalOpen, isBorrowing]);

  async function handleBorrowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (borrowInFlight.current) return;

    if (!session) {
      toast.error('Please sign in before borrowing a book.');
      router.replace(`/sign-in?next=${encodeURIComponent(`/books/${id}`)}`);
      return;
    }

    if (!book || book.availableCopies < 1) {
      const msg = 'There are no copies available to borrow.';
      setBorrowModalError(msg);
      toast.error(msg);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!returnDate || returnDate <= todayStr) {
      setBorrowModalError('Please choose a return date in the future.');
      return;
    }

    const requestedReturnDate = new Date(`${returnDate}T23:59:59`);
    if (
      Number.isNaN(requestedReturnDate.getTime()) ||
      requestedReturnDate <= new Date()
    ) {
      setBorrowModalError('Please choose a valid future return date.');
      return;
    }

    borrowInFlight.current = true;
    setIsBorrowing(true);
    setBorrowModalError(null);

    try {
      await createBorrow({
        bookId: book._id,
        returnDate: requestedReturnDate.toISOString(),
      });

      toast.success(
        `“${book.title}” borrowed successfully! Added to your reading list.`
      );
      setIsBorrowModalOpen(false);

      // Refresh book data to reflect immediate inventory decrement
      try {
        const refreshed = await getBook(id);
        setBookLoadState({ requestKey, book: refreshed });
      } catch {
        setBookLoadState((curr) => {
          if (!curr?.book || curr.requestKey !== requestKey) return curr;
          return {
            ...curr,
            book: {
              ...curr.book,
              availableCopies: Math.max(0, curr.book.availableCopies - 1),
            },
          };
        });
      }
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : "We couldn't borrow this book. Please try again.";
      setBorrowModalError(errorMessage);
      toast.error(errorMessage);
    } finally {
      borrowInFlight.current = false;
      setIsBorrowing(false);
    }
  }

  // Session checking state
  if (isSessionPending) {
    return (
      <main className="reading-room-paper min-h-[calc(100vh-68px)]">
        <BookDetailSkeleton />
      </main>
    );
  }

  // If not authenticated, the useEffect redirects, render loading skeleton in the meantime
  if (!session) {
    return (
      <main className="reading-room-paper min-h-[calc(100vh-68px)]">
        <BookDetailSkeleton />
      </main>
    );
  }

  return (
    <main className="reading-room-paper min-h-[calc(100vh-68px)] text-foreground">
      {isLoading ? (
        <BookDetailSkeleton />
      ) : error || !book ? (
        <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <BookOpen
            className="mx-auto h-12 w-12 text-primary"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-semibold">Book Not Found</h1>
          <p className="mt-2 text-muted">
            {error ||
              'This book could not be found or has been removed from the library.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="rounded-sm border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface"
            >
              Try again
            </button>
            <Link
              href="/books"
              className="min-h-11 border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
            >
              Browse All Books
            </Link>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
          {/* Breadcrumb navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to All Books
            </Link>

            <span className="border border-brass/60 bg-surface px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-secondary-accent">
              {book.category}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)] lg:gap-14">
            {/* Book Cover Column */}
            <div>
              <div className="reading-room-cover relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden bg-surface-secondary">
                {book.image && !coverFailed ? (
                  <Image
                    src={book.image}
                    alt={`Cover of ${book.title}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                    onError={() => setFailedCoverUrl(book.image)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface-secondary px-8 text-center text-secondary-accent">
                    <BookOpen size={52} strokeWidth={1.2} aria-hidden="true" />
                    <span className="font-serif text-2xl text-foreground">
                      {book.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Added by / Owner Information Card */}
              <div className="mx-auto mt-5 max-w-md border-y border-border bg-surface/60 p-4 text-sm">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-brass">
                  From the community shelves
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-surface-secondary text-secondary-accent">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      Added by {book.addedBy?.name || 'BookNook Member'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {book.addedBy?.email}
                    </p>
                  </div>
                </div>
                {book.createdAt && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={13} />
                    Added on {formatDate(book.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Book Info Column */}
            <section className="min-w-0">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-brass">
                  Bookplate · {book.category}
                </p>
                <h1 className="mt-3 font-serif text-5xl font-medium leading-[0.98] tracking-tight sm:text-6xl">
                  {book.title}
                </h1>
                <p className="mt-3 font-serif text-2xl italic text-muted">
                  by {book.author}
                </p>
              </div>

              {/* Copies & Inventory Status */}
              <div className="mt-7 grid grid-cols-2 gap-4 border-y border-border bg-surface/55 px-1 py-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Available Copies
                  </p>
                  <p className="mt-1 font-serif text-3xl text-primary">
                    {book.availableCopies}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Total Copies
                  </p>
                  <p className="mt-1 font-serif text-3xl">{book.totalCopies}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Status
                  </p>
                  <div className="mt-2">
                    {book.availableCopies > 0 ? (
                      <span className="inline-flex items-center gap-1.5 border border-status-success/50 bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-status-success">
                        <CheckCircle2 size={13} />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 border border-status-danger/50 bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-status-danger">
                        <Info size={13} />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Description */}
              <div className="mt-7">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  About this book
                </h2>
                <div className="mt-3 whitespace-pre-line text-base leading-7 text-foreground/90">
                  {book.description}
                </div>
              </div>

              {/* Borrow Call to Action */}
              <div className="mt-8 border-t-2 border-primary bg-surface/55 px-1 py-6">
                <h2 className="font-serif text-2xl">Borrow this edition</h2>
                <p className="mt-1 text-sm text-muted">
                  Registered members can borrow available titles and track
                  return dates in their personal reading dashboard.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setReturnDate(getTomorrowDateString());
                      setBorrowModalError(null);
                      setIsBorrowModalOpen(true);
                    }}
                    disabled={book.availableCopies < 1}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-primary bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-secondary disabled:text-muted"
                  >
                    <BookOpen size={18} />
                    {book.availableCopies > 0
                      ? 'Borrow This Book'
                      : 'No Copies Available'}
                  </button>

                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-12 items-center justify-center border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    View My Borrows
                  </Link>
                </div>

                {book.availableCopies < 1 && (
                  <p className="mt-3 text-xs text-status-danger">
                    All {book.totalCopies} copies are currently borrowed. Check
                    back soon when other readers return their copies.
                  </p>
                )}
              </div>
            </section>
          </div>
          {related && related.books.length > 0 && (
            <section className="mt-16 border-t border-border pt-9">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-brass">
                    From the same shelf
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
                    More in {book.category}
                  </h2>
                </div>
                <Link
                  href={`/books?category=${encodeURIComponent(book.category)}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Browse shelf
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {related.books.map((relatedBook) => (
                  <Link
                    key={relatedBook._id}
                    href={`/books/${encodeURIComponent(relatedBook._id)}`}
                    className="group min-w-0 border-b border-border pb-3"
                  >
                    <div className="reading-room-cover relative aspect-[3/4] overflow-hidden bg-surface-secondary">
                      <Image
                        src={relatedBook.image}
                        alt={`Cover of ${relatedBook.title}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 40vw, 18vw"
                        className="object-cover transition group-hover:scale-[1.03]"
                      />
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-serif text-lg leading-tight group-hover:text-primary">
                      {relatedBook.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted">
                      {relatedBook.author}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Borrow Modal (Assignment 8 Requirement) */}
      {isBorrowModalOpen && book && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 sm:p-6"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBorrowing) {
              setIsBorrowModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="borrow-modal-title"
            className="w-full max-w-lg border border-border bg-surface p-6 shadow-[0_28px_80px_rgb(var(--shadow-color)/0.28)] sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <CalendarDays size={14} />
                  Borrow Request
                </span>
                <h2
                  id="borrow-modal-title"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  Borrow “{book.title}”
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBorrowModalOpen(false)}
                disabled={isBorrowing}
                aria-label="Close modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted transition hover:text-foreground disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBorrowSubmit} className="mt-6 space-y-5">
              {/* Logged in User Name (read-only) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="borrow-user-name"
                  className="block text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  Borrower Name
                </label>
                <input
                  id="borrow-user-name"
                  type="text"
                  disabled
                  value={session.user.name || 'BookNook Reader'}
                  className="w-full border border-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground outline-none"
                />
              </div>

              {/* Logged in User Email (read-only) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="borrow-user-email"
                  className="block text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  Borrower Email
                </label>
                <input
                  id="borrow-user-email"
                  type="email"
                  disabled
                  value={session.user.email}
                  className="w-full border border-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground outline-none"
                />
              </div>

              {/* Return Date Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="borrow-return-date"
                  className="block text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  Return Date <span className="text-status-danger">*</span>
                </label>
                <input
                  id="borrow-return-date"
                  type="date"
                  required
                  min={getTomorrowDateString()}
                  value={returnDate}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    setBorrowModalError(null);
                  }}
                  className="w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <p className="text-xs text-muted">
                  Choose the date you plan to return this book.
                </p>
              </div>

              {/* Error in modal if any */}
              {borrowModalError && (
                <div
                  role="alert"
                  className="border-l-2 border-status-danger bg-status-danger/10 p-3.5 text-sm text-status-danger"
                >
                  {borrowModalError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsBorrowModalOpen(false)}
                  disabled={isBorrowing}
                  className="inline-flex min-h-11 items-center justify-center border border-border px-5 text-sm font-semibold transition hover:bg-background disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBorrowing}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-primary bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBorrowing ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Borrowing Book...
                    </>
                  ) : (
                    'Confirm Borrow'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
