'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  LogOut,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { signOut, useSession } from '@/lib/auth-client';
import {
  ApiError,
  getBook,
  getMyBorrows,
  returnBorrow,
  type Book,
  type Borrow,
} from '@/lib/api';
import {
  EMPTY_READING_LIST,
  getSavedBookIds,
  subscribeToSavedBookIds,
  toggleSavedBook,
} from '@/lib/reading-list';
import ReadingProfileEditor from './reading-profile-editor';
import {
  EMPTY_READING_PREFERENCES,
  getReadingPreferences,
  subscribeToReadingPreferences,
} from '@/lib/reading-preferences';

type DueTone = 'soon' | 'overdue' | 'on-time' | 'returned';

interface ActivityItem {
  id: string;
  kind: 'borrowed' | 'returned';
  title: string;
  at: Date;
}

interface BookDetailsState {
  key: string;
  books: Record<string, Book>;
  unavailableIds: string[];
  failedIds: string[];
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string | Date | null | undefined): string | null {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;
}

function getDueState(borrow: Borrow): { label: string; tone: DueTone } | null {
  if (borrow.status === 'returned') {
    return { label: 'Returned', tone: 'returned' };
  }

  const dueDate = parseDate(borrow.returnDate);
  if (!dueDate) return null;

  const today = new Date();
  const dueDay = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const daysUntilDue = Math.ceil(
    (dueDay.getTime() - todayDay.getTime()) / 86_400_000
  );

  if (daysUntilDue < 0) return { label: 'Overdue', tone: 'overdue' };
  if (daysUntilDue <= 3) return { label: 'Due Soon', tone: 'soon' };
  return { label: 'On Time', tone: 'on-time' };
}

function getInitials(name: string | null | undefined): string {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join('');
  return initials || 'R';
}

function getActivity(borrows: Borrow[]): ActivityItem[] {
  return borrows
    .flatMap((borrow) => {
      const borrowedAt =
        parseDate(borrow.createdAt) ?? parseDate(borrow.borrowDate);
      const returnedAt =
        borrow.status === 'returned' ? parseDate(borrow.returnedAt) : null;
      const events: ActivityItem[] = [];

      if (borrowedAt) {
        events.push({
          id: `${borrow._id}-borrowed`,
          kind: 'borrowed',
          title: borrow.bookTitle,
          at: borrowedAt,
        });
      }
      if (returnedAt) {
        events.push({
          id: `${borrow._id}-returned`,
          kind: 'returned',
          title: borrow.bookTitle,
          at: returnedAt,
        });
      }
      return events;
    })
    .sort((first, second) => second.at.getTime() - first.at.getTime());
}

function BookImage({
  src,
  title,
  className = '',
}: {
  src: string | null | undefined;
  title: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = !src || failedSource === src;

  return (
    <div
      className={`reading-corner-cover relative shrink-0 overflow-hidden rounded-sm bg-surface-secondary ${className}`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={`Cover of ${title}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 68px, 84px"
          className="object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <div
          role="img"
          aria-label={`No cover available for ${title}`}
          className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-secondary-accent"
        >
          <BookOpen size={20} strokeWidth={1.3} aria-hidden="true" />
          <span className="line-clamp-3 font-serif text-[0.65rem] leading-tight text-foreground">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-secondary-accent">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span className="shrink-0 pb-1 text-xs text-muted">
          {count} {count === 1 ? 'book' : 'books'}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const Icon =
    label === 'Currently Borrowed'
      ? Clock3
      : label === 'Books Returned'
        ? Check
        : label === 'Saved Books'
          ? Bookmark
          : BookOpen;

  return (
    <div className="reading-corner-stat flex min-w-0 items-start justify-between gap-3 rounded-sm p-4 sm:p-5">
      <div className="min-w-0">
        <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted sm:text-xs">
          {label}
        </dt>
        <dd className="mt-3 font-serif text-4xl leading-none text-foreground sm:text-5xl">
          {value}
        </dd>
      </div>
      <span className="reading-corner-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-sm">
        <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
      </span>
    </div>
  );
}

function DueBadge({ borrow }: { borrow: Borrow }) {
  const dueState = getDueState(borrow);
  if (!dueState) return null;

  const toneClass: Record<DueTone, string> = {
    soon: 'text-primary bg-surface-secondary',
    overdue: 'text-status-danger bg-surface-secondary',
    'on-time': 'text-status-success bg-surface-secondary',
    returned: 'text-muted bg-background',
  };

  return (
    <span
      className={`reading-corner-status inline-flex min-h-7 items-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold ${toneClass[dueState.tone]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {dueState.label}
    </span>
  );
}

function BorrowSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading borrowing history">
      {[0, 1].map((item) => (
        <div key={item} className="reading-corner-borrow-row animate-pulse">
          <div className="h-[6.25rem] w-[4.25rem] shrink-0 rounded-sm bg-surface-secondary" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-5 w-2/3 rounded bg-surface-secondary" />
            <div className="h-4 w-1/2 rounded bg-surface-secondary" />
            <div className="h-4 w-3/4 rounded bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReadingCorner() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const savedBookIds = useSyncExternalStore(
    subscribeToSavedBookIds,
    getSavedBookIds,
    () => EMPTY_READING_LIST
  );
  const userId = session?.user.id ?? '';
  const subscribePreferences = useCallback(
    (onChange: () => void) => subscribeToReadingPreferences(userId, onChange),
    [userId]
  );
  const readPreferences = useCallback(
    () => getReadingPreferences(userId),
    [userId]
  );
  const readServerPreferences = useCallback(
    () => EMPTY_READING_PREFERENCES,
    []
  );
  const readingPreferences = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    readServerPreferences
  );
  const [reloadCount, setReloadCount] = useState(0);
  const [borrowState, setBorrowState] = useState<{
    key: string;
    borrows: Borrow[];
    error?: string;
  } | null>(null);
  const [bookDetails, setBookDetails] = useState<BookDetailsState | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [removingSavedId, setRemovingSavedId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const returnInFlight = useRef(false);

  const borrowRequestKey = `${session?.user.id ?? ''}:${reloadCount}`;
  const currentBorrowState =
    borrowState?.key === borrowRequestKey ? borrowState : null;
  const borrows = currentBorrowState?.borrows ?? [];
  const borrowError = currentBorrowState?.error;
  const isBorrowLoading = isPending || !session || currentBorrowState === null;
  const detailIds = Array.from(
    new Set([...borrows.map((borrow) => borrow.bookId), ...savedBookIds])
  );
  const detailRequestKey = detailIds.join('\u001f');
  const currentDetails =
    bookDetails?.key === detailRequestKey ? bookDetails : null;
  const detailBooks = currentDetails?.books ?? {};
  const unavailableIds = currentDetails?.unavailableIds ?? [];
  const failedIds = currentDetails?.failedIds ?? [];
  const isDetailLoading = currentDetails === null;
  const resolvedSavedBooks = savedBookIds.flatMap((id) =>
    detailBooks[id] ? [{ id, book: detailBooks[id] }] : []
  );
  const activeBorrows = borrows.filter((borrow) => borrow.status === 'active');
  const returnedBorrows = borrows.filter(
    (borrow) => borrow.status === 'returned'
  );
  const activity = borrowError ? [] : getActivity(borrows).slice(0, 8);
  const displayName = session?.user.name?.trim() || 'BookNook reader';

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(
        `/sign-in?next=${encodeURIComponent('/dashboard/profile')}`
      );
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (isPending || !session) return;

    let active = true;
    getMyBorrows()
      .then((result) => {
        if (active) setBorrowState({ key: borrowRequestKey, borrows: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBorrowState({
          key: borrowRequestKey,
          borrows: [],
          error:
            error instanceof Error
              ? error.message
              : 'Your borrowing history could not be loaded.',
        });
      });

    return () => {
      active = false;
    };
  }, [borrowRequestKey, isPending, session]);

  const detailIdsKey = detailRequestKey;
  useEffect(() => {
    let active = true;
    const ids = detailIdsKey ? detailIdsKey.split('\u001f') : [];

    Promise.all(
      ids.map(async (id) => {
        try {
          return {
            id,
            book: await getBook(id),
            unavailable: false,
            failed: false,
          };
        } catch (error) {
          const unavailable = error instanceof ApiError && error.status === 404;
          return { id, book: null, unavailable, failed: !unavailable };
        }
      })
    ).then((results) => {
      if (!active) return;
      setBookDetails({
        key: detailIdsKey,
        books: Object.fromEntries(
          results.flatMap(({ id, book }) => (book ? [[id, book]] : []))
        ),
        unavailableIds: results
          .filter((result) => result.unavailable)
          .map((result) => result.id),
        failedIds: results
          .filter((result) => result.failed)
          .map((result) => result.id),
      });
    });

    return () => {
      active = false;
    };
  }, [detailIdsKey]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        toast.error(result.error.message || 'Unable to sign out.');
        return;
      }
      toast.success('You have signed out.');
      router.replace('/');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to sign out.'
      );
    } finally {
      setSigningOut(false);
    }
  }

  async function handleReturn(borrowId: string) {
    if (returnInFlight.current) return;

    returnInFlight.current = true;
    setReturningId(borrowId);
    try {
      await returnBorrow(borrowId);
      toast.success('Book returned successfully.');
      setReloadCount((count) => count + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to return this book.'
      );
    } finally {
      returnInFlight.current = false;
      setReturningId(null);
    }
  }

  function handleRemoveSaved(id: string) {
    setRemovingSavedId(id);
    window.setTimeout(() => {
      toggleSavedBook(id);
      setRemovingSavedId(null);
    }, 180);
  }

  if (isPending || !session) {
    return (
      <main className="reading-corner-paper min-h-[calc(100vh-68px)] px-5 py-12">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-44 rounded-sm bg-surface-secondary" />
          <div className="h-24 rounded-sm bg-surface-secondary" />
          <div className="grid gap-8 xl:grid-cols-[1.85fr_1fr]">
            <div className="h-96 rounded-sm bg-surface-secondary" />
            <div className="h-96 rounded-sm bg-surface-secondary" />
          </div>
        </div>
      </main>
    );
  }

  const stats = borrowError
    ? [{ label: 'Saved Books', value: savedBookIds.length }]
    : [
        { label: 'Total Borrowed', value: borrows.length },
        { label: 'Currently Borrowed', value: activeBorrows.length },
        { label: 'Books Returned', value: returnedBorrows.length },
        { label: 'Saved Books', value: savedBookIds.length },
      ];
  const memberDate = parseDate(String(session.user.createdAt ?? ''));

  return (
    <main className="reading-corner-paper min-h-[calc(100vh-68px)] px-5 py-9 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="reading-corner-enter border-b border-border pb-8 sm:pb-10">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="reading-corner-identity flex min-w-0 items-center gap-4 sm:gap-6">
              <div className="group relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                {session.user.image && !avatarFailed ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    fill
                    unoptimized
                    onError={() => setAvatarFailed(true)}
                    className="reading-corner-avatar rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-label={`${displayName} initials`}
                    className="reading-corner-monogram flex h-full w-full items-center justify-center rounded-full font-serif text-3xl sm:text-4xl"
                  >
                    {getInitials(session.user.name)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  aria-label="Edit profile picture and information"
                  title="Edit profile"
                  className="absolute -bottom-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:scale-110 hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="mb-2 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-secondary-accent">
                  <span className="h-px w-5 bg-secondary-accent" /> Reader
                </p>
                <h1 className="font-serif text-4xl font-medium leading-none text-foreground sm:text-6xl">
                  Your Reading Corner
                </h1>
                <p className="mt-3 truncate text-base font-medium text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-sm text-muted">
                  {session.user.email}
                </p>
                {memberDate && (
                  <p className="mt-1 text-xs text-muted">
                    A reader since{' '}
                    {memberDate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Edit Profile
              </button>
              <Link
                href="/books"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Browse Books <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
              >
                {signingOut ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <LogOut size={15} aria-hidden="true" />
                )}
                {signingOut ? 'Signing out' : 'Sign out'}
              </button>
            </div>
          </div>
        </header>

        <dl
          aria-label="Reading overview"
          className={`reading-corner-stats mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-4 ${stats.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-1'}`}
        >
          {stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </dl>

        {readingPreferences.bio ||
        readingPreferences.motto ||
        readingPreferences.interests.length > 0 ||
        readingPreferences.favoriteGenres.length > 0 ||
        readingPreferences.favoriteAuthors.length > 0 ? (
          <section className="reading-corner-about mt-9" aria-label="About me">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-secondary-accent">
                  Between the pages
                </p>
                <h2 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
                  About Me
                </h2>
              </div>
              <p className="text-xs text-muted">Reading notes · this device</p>
            </div>
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                {readingPreferences.bio && (
                  <p className="max-w-3xl text-base leading-7 text-foreground">
                    {readingPreferences.bio}
                  </p>
                )}
                {readingPreferences.motto && (
                  <blockquote className="border-l-2 border-primary pl-4 font-serif text-xl italic leading-relaxed text-primary">
                    “{readingPreferences.motto}”
                  </blockquote>
                )}
              </div>
              <div className="space-y-4">
                {[
                  ['Interests', readingPreferences.interests],
                  ['Favorite genres', readingPreferences.favoriteGenres],
                  ['Favorite authors', readingPreferences.favoriteAuthors],
                ].map(([label, values]) =>
                  Array.isArray(values) && values.length > 0 ? (
                    <div key={String(label)}>
                      <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                        {label}
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {values.map((value) => (
                          <li
                            key={value}
                            className="reading-corner-interest-tag"
                          >
                            {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-9 grid gap-12 xl:grid-cols-[minmax(0,1.85fr)_minmax(18rem,1fr)] xl:gap-14">
          <section className="reading-corner-enter min-w-0">
            <SectionTitle
              eyebrow="Out in the world"
              title="Currently Borrowed"
              count={
                !isBorrowLoading && !borrowError
                  ? activeBorrows.length
                  : undefined
              }
            />

            {isBorrowLoading ? (
              <BorrowSkeleton />
            ) : borrowError ? (
              <div className="reading-corner-message" role="alert">
                <p className="font-serif text-2xl text-foreground">
                  Your shelf could not be reached.
                </p>
                <p className="mt-2 text-sm text-muted">{borrowError}</p>
                <button
                  type="button"
                  onClick={() => setReloadCount((count) => count + 1)}
                  className="mt-4 min-h-10 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : activeBorrows.length === 0 ? (
              <div className="reading-corner-message">
                <BookOpen
                  className="text-secondary-accent"
                  size={26}
                  aria-hidden="true"
                />
                <p className="mt-3 font-serif text-2xl text-foreground">
                  Your next story is waiting.
                </p>
                <p className="mt-2 text-sm text-muted">
                  You don't have any books checked out right now.
                </p>
                <Link
                  href="/books"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Find a book <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBorrows.map((borrow) => {
                  const book = detailBooks[borrow.bookId];
                  const borrowedDate = formatDate(borrow.borrowDate);
                  const dueDate = formatDate(borrow.returnDate);
                  const availableCopies = book?.availableCopies;

                  return (
                    <article
                      key={borrow._id}
                      className="reading-corner-borrow-row group"
                    >
                      <Link
                        href={`/books/${encodeURIComponent(borrow.bookId)}`}
                        aria-label={`View ${borrow.bookTitle}${book?.author ? ` by ${book.author}` : ''}`}
                        className="reading-corner-borrow-cover-link"
                      >
                        <BookImage
                          src={borrow.bookImage || book?.image}
                          title={borrow.bookTitle}
                          className="h-[6.25rem] w-[4.25rem] sm:h-[7.5rem] sm:w-[5rem]"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/books/${encodeURIComponent(borrow.bookId)}`}
                              className="font-serif text-2xl leading-tight text-foreground transition group-hover:text-primary sm:text-3xl"
                            >
                              {borrow.bookTitle}
                            </Link>
                            {book?.author && (
                              <p className="mt-1 truncate text-sm text-muted">
                                {book.author}
                              </p>
                            )}
                          </div>
                          <DueBadge borrow={borrow} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted sm:text-sm">
                          {borrowedDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={14} aria-hidden="true" />
                              Borrowed {borrowedDate}
                            </span>
                          )}
                          {dueDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={14} aria-hidden="true" />
                              Due {dueDate}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-3">
                          <span className="text-xs text-muted">
                            {availableCopies !== undefined
                              ? availableCopies > 0
                                ? `${availableCopies} other ${availableCopies === 1 ? 'copy' : 'copies'} available`
                                : 'No other copies available'
                              : 'Availability unavailable'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReturn(borrow._id)}
                            disabled={returningId !== null}
                            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
                          >
                            {returningId === borrow._id ? (
                              <LoaderCircle
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <RotateCcw size={15} aria-hidden="true" />
                            )}
                            {returningId === borrow._id
                              ? 'Returning'
                              : 'Return book'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {returnedBorrows.length > 0 && !borrowError && (
              <section
                className="reading-corner-returned mt-10"
                aria-label="Recently returned books"
              >
                <SectionTitle
                  eyebrow="Back on the shelves"
                  title="Recently Returned"
                  count={returnedBorrows.length}
                />
                <div className="space-y-3">
                  {returnedBorrows.slice(0, 4).map((borrow) => {
                    const book = detailBooks[borrow.bookId];
                    const returnedDate = formatDate(borrow.returnedAt);
                    return (
                      <article
                        key={borrow._id}
                        className="reading-corner-borrow-row reading-corner-borrow-row--returned"
                      >
                        <Link
                          href={`/books/${encodeURIComponent(borrow.bookId)}`}
                          aria-label={`View ${borrow.bookTitle}`}
                        >
                          <BookImage
                            src={borrow.bookImage || book?.image}
                            title={borrow.bookTitle}
                            className="h-20 w-14"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/books/${encodeURIComponent(borrow.bookId)}`}
                            className="font-serif text-xl text-foreground hover:text-primary"
                          >
                            {borrow.bookTitle}
                          </Link>
                          {book?.author && (
                            <p className="mt-1 text-sm text-muted">
                              {book.author}
                            </p>
                          )}
                          {returnedDate && (
                            <p className="mt-2 text-xs text-muted">
                              Returned {returnedDate}
                            </p>
                          )}
                        </div>
                        <DueBadge borrow={borrow} />
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </section>

          <aside className="reading-corner-enter min-w-0 space-y-12">
            <section aria-label="Saved books">
              <SectionTitle
                eyebrow="Kept close"
                title="My Favorite Shelf"
                count={!isDetailLoading ? resolvedSavedBooks.length : undefined}
              />
              <p className="-mt-2 mb-4 text-xs text-muted">
                Saved on this device
              </p>

              {isDetailLoading ? (
                <div
                  className="reading-corner-saved-list"
                  aria-label="Loading saved books"
                >
                  {[0, 1].map((item) => (
                    <div key={item} className="flex animate-pulse gap-3 py-3">
                      <div className="h-16 w-11 rounded-sm bg-surface-secondary" />
                      <div className="flex-1 space-y-2 py-2">
                        <div className="h-4 w-4/5 rounded bg-surface-secondary" />
                        <div className="h-3 w-2/3 rounded bg-surface-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resolvedSavedBooks.length > 0 ? (
                <div className="reading-corner-saved-list">
                  {resolvedSavedBooks.map(({ id, book }) => (
                    <article
                      key={id}
                      className={`reading-corner-saved-row ${removingSavedId === id ? 'is-removing' : ''}`}
                    >
                      <Link
                        href={`/books/${encodeURIComponent(book._id)}`}
                        aria-label={`View ${book.title} by ${book.author}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <BookImage
                          src={book.image}
                          title={book.title}
                          className="h-16 w-11"
                        />
                        <span className="min-w-0">
                          <span className="block line-clamp-2 font-serif text-lg leading-tight text-foreground">
                            {book.title}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted">
                            {book.author}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(id)}
                        disabled={removingSavedId === id}
                        aria-label={`Remove ${book.title} from saved books`}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm text-muted transition hover:bg-surface-secondary hover:text-primary disabled:opacity-50"
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              ) : savedBookIds.length === 0 ? (
                <div className="reading-corner-message py-7">
                  <p className="font-serif text-2xl text-foreground">
                    Your reading list is waiting for its first story.
                  </p>
                  <Link
                    href="/books"
                    className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Browse Books <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ) : null}

              {(unavailableIds.length > 0 || failedIds.length > 0) && (
                <div className="mt-4 border-t border-border pt-3">
                  {unavailableIds.map((id) => (
                    <div
                      key={id}
                      className="flex min-h-10 items-center justify-between gap-3 text-xs text-muted"
                    >
                      <span>A saved title is no longer available.</span>
                      <button
                        type="button"
                        onClick={() => toggleSavedBook(id)}
                        className="min-h-9 shrink-0 font-semibold text-primary hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {failedIds.length > 0 && (
                    <p className="text-xs text-muted">
                      {failedIds.length} saved{' '}
                      {failedIds.length === 1 ? 'title could' : 'titles could'}{' '}
                      not be loaded. They remain saved on this device.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section aria-label="Recent activity">
              <SectionTitle
                eyebrow="From your shelves"
                title="Recent Activity"
              />
              {isBorrowLoading ? (
                <div className="space-y-4" aria-label="Loading recent activity">
                  <div className="h-14 animate-pulse rounded-sm bg-surface-secondary" />
                  <div className="h-14 animate-pulse rounded-sm bg-surface-secondary" />
                </div>
              ) : borrowError ? (
                <p className="text-sm text-muted">
                  Activity is unavailable until your borrowing history loads.
                </p>
              ) : activity.length > 0 ? (
                <ol className="reading-corner-timeline">
                  {activity.map((item) => (
                    <li key={item.id} className="reading-corner-timeline-item">
                      <span
                        className={`reading-corner-timeline-mark ${item.kind === 'returned' ? 'is-returned' : ''}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 pb-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary-accent">
                          Book {item.kind}
                        </p>
                        <p className="mt-1 truncate font-serif text-lg text-foreground">
                          {item.title}
                        </p>
                        <time
                          dateTime={item.at.toISOString()}
                          className="mt-1 block text-xs text-muted"
                        >
                          {formatDate(item.at)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Your reading history will gather here as you borrow and return
                  books.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
      {isEditorOpen && (
        <ReadingProfileEditor
          user={{
            id: session.user.id,
            name: session.user.name,
            image: session.user.image,
          }}
          preferences={readingPreferences}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </main>
  );
}
