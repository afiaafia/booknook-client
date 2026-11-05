'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Star,
} from 'lucide-react';

import type { Book } from '@/lib/api';

import {
  EMPTY_READING_LIST,
  getSavedBookIds,
  subscribeToSavedBookIds,
  toggleSavedBook,
} from '@/lib/reading-list';

export interface BookCardProps {
  book: Book;
  variant?: 'standard' | 'featured' | 'saved' | 'catalogue';
  collectionLabel?: string;
  showSaveButton?: boolean;
  className?: string;
}

/**
 * Decorative catalogue stars.
 * Recognised popular titles receive five stars.
 * Other titles receive a stable varied visual score.
 * These are not verified reader ratings.
 */
function getDisplayStars(title: string, bookId: string): number {
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const popularTitles = [
    'cannthurme',
    'atomichabits',
    'thepsychologyofmoney',
    'richdadpoordad',
    'thealchemist',
    'harrypotter',
    'ikigai',
    'thinkandgrowrich',
    'thepowerofhabit',
    'deepwork',
    'the48lawsofpower',
    'howtowinfriendsandinfluencepeople',
    'the7habitsofhighlyeffectivepeople',
    'themonkwhosoldhisferrari',
    'manssearchformeaning',
    'theartofwar',
    'sapiens',
    'thesubtleartofnotgivingafuck',
  ];

  if (popularTitles.some((title) => normalizedTitle.includes(title))) {
    return 5;
  }

  let hash = 0;

  for (let index = 0; index < bookId.length; index += 1) {
    hash = (hash * 31 + bookId.charCodeAt(index)) >>> 0;
  }

  return 3 + (hash % 2);
}

export default function BookCard({
  book,
  variant = 'standard',
  collectionLabel,
  showSaveButton = true,
  className = '',
}: BookCardProps) {
  const [coverFailed, setCoverFailed] = useState(!book.image);

  const savedIds = useSyncExternalStore(
    subscribeToSavedBookIds,
    getSavedBookIds,
    () => EMPTY_READING_LIST
  );

  const isSaved = savedIds.includes(book._id);
  const isAvailable = book.availableCopies > 0;
  const isFeatured = variant === 'featured';
  const isCatalogue = variant === 'catalogue';

  const effectiveVariant =
    variant === 'saved' || isSaved ? 'saved' : variant;

  const displayStars = getDisplayStars(book.title, book._id);

  function handleSaveClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleSavedBook(book._id);
  }

  const bookUrl = `/books/${encodeURIComponent(book._id)}`;

  const coverElement = (
    <div
      className={`bindery-cover-wrap relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-secondary transition duration-300 ${
        isCatalogue
          ? 'group-hover:shadow-[0_14px_30px_rgb(var(--shadow-color)/0.16)]'
          : 'group-hover:-translate-y-1 group-hover:shadow-[0_16px_34px_rgb(var(--shadow-color)/0.18)]'
      } ${isFeatured ? 'sm:max-w-[280px]' : ''}`}
    >
      {effectiveVariant === 'saved' && (
        <span
          className="bindery-ribbon"
          title="Saved to personal reading ledger"
          aria-label="Bookmarked volume"
        />
      )}

      {book.image && !coverFailed ? (
        <Image
          src={book.image}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          fill
          unoptimized
          sizes={
            isFeatured
              ? '(max-width: 768px) 100vw, 320px'
              : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
          }
          onError={() => setCoverFailed(true)}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div
          role="img"
          aria-label={`Cover of ${book.title}`}
          className="flex h-full flex-col items-center justify-center gap-3 bg-surface-secondary px-4 text-center text-secondary-accent"
        >
          <BookOpen size={isFeatured ? 44 : 32} strokeWidth={1.2} />

          <span className="line-clamp-3 font-serif text-sm leading-tight text-foreground">
            {book.title}
          </span>
        </div>
      )}

      <span className="absolute left-2.5 top-2.5 z-10 max-w-[75%] truncate border border-border/80 bg-surface/95 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-secondary-accent shadow-sm backdrop-blur-sm">
        {book.category}
      </span>

      {showSaveButton && (
        <button
          type="button"
          onClick={handleSaveClick}
          aria-label={
            isSaved
              ? `Remove ${book.title} from saved volumes`
              : `Save ${book.title} to reading ledger`
          }
          aria-pressed={isSaved}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/95 text-foreground shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {isSaved ? (
            <BookmarkCheck size={16} className="text-primary" />
          ) : (
            <Bookmark size={15} />
          )}
        </button>
      )}
    </div>
  );

  // FEATURED EDITION
  if (isFeatured) {
    return (
      <article
        className={`bindery-card group relative grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8 ${className}`}
      >
        <Link
          href={bookUrl}
          className="block shrink-0"
          aria-label={`View ${book.title} by ${book.author}`}
        >
          {coverElement}
        </Link>

        <div className="flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-brass">
                {collectionLabel || 'Featured Edition · Vol. Archive'}
              </span>

              <span className="h-px flex-1 bg-border/60" />
            </div>

            <Link href={bookUrl} className="mt-2 block">
              <h3 className="font-serif text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary sm:text-3xl">
                {book.title}
              </h3>
            </Link>

            <p className="mt-2 font-serif text-base italic text-muted">
              by {book.author}
            </p>

            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-foreground/80 sm:line-clamp-4">
              {book.description}
            </p>
          </div>

          <div className="mt-6 border-t border-border/80 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span
                className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                  isAvailable ? 'text-secondary-accent' : 'text-primary'
                }`}
              >
                {isAvailable
                  ? `${book.availableCopies} of ${book.totalCopies} copies in library`
                  : 'Currently on loan'}
              </span>

              <Link
                href={bookUrl}
                className="inline-flex min-h-10 items-center gap-2 border border-primary bg-primary px-5 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary-dark"
              >
                <span>Examine Volume</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // CATALOGUE EDITION
  if (isCatalogue) {
    return (
      <article
        className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface p-2 shadow-[0_3px_12px_rgb(var(--shadow-color)/0.045)] transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_14px_32px_rgb(var(--shadow-color)/0.11)] sm:p-2.5 ${className}`}
      >
        <Link
          href={bookUrl}
          className="block"
          aria-label={`View ${book.title} by ${book.author}`}
        >
          {coverElement}
        </Link>

        <div className="flex flex-1 flex-col px-1 pb-0 pt-2">
          <div className="flex-1">
            <p className="mb-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-brass">
              {collectionLabel || 'From the collection'}
            </p>

            <Link href={bookUrl} className="block">
              <h3 className="line-clamp-2 font-serif text-[0.95rem] font-medium leading-[1.3] text-foreground transition group-hover:text-primary sm:text-base">
                {book.title}
              </h3>
            </Link>

            <p className="mt-0.5 truncate text-[0.7rem] text-muted sm:text-xs">
              {book.author}
            </p>

            <div
              className="mt-1.5 flex items-center gap-0.5 text-brass"
              aria-label={`${displayStars} decorative stars`}
              title="Decorative catalogue stars"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={12}
                  strokeWidth={1.5}
                  fill={index < displayStars ? 'currentColor' : 'none'}
                  className={index < displayStars ? '' : 'text-border'}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span
                className={`truncate text-[0.65rem] font-semibold sm:text-xs ${
                  isAvailable ? 'text-secondary-accent' : 'text-primary'
                }`}
              >
                {isAvailable
                  ? `${book.availableCopies} available`
                  : 'Checked out'}
              </span>

              {effectiveVariant === 'saved' && (
                <span className="text-[0.52rem] font-semibold uppercase tracking-wider text-primary">
                  Saved
                </span>
              )}
            </div>

            <Link
              href={bookUrl}
              aria-label={`View edition: ${book.title}`}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary/30 px-3 text-[0.65rem] font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              View
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // STANDARD & SAVED EDITIONS
  return (
    <article
      className={`group flex min-w-0 flex-col justify-between border-b border-border/80 pb-4 transition duration-200 hover:border-primary ${className}`}
    >
      <Link
        href={bookUrl}
        className="block"
        aria-label={`View ${book.title} by ${book.author}`}
      >
        {coverElement}

        <div className="pt-3.5">
          {collectionLabel && (
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-brass">
              {collectionLabel}
            </p>
          )}

          <h3 className="line-clamp-2 font-serif text-lg leading-snug text-foreground transition group-hover:text-primary sm:text-xl">
            {book.title}
          </h3>

          <p className="mt-1 truncate text-xs text-muted sm:text-sm">
            {book.author}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span
              className={`text-[0.72rem] font-medium ${
                isAvailable ? 'text-secondary-accent' : 'text-primary'
              }`}
            >
              {isAvailable
                ? `${book.availableCopies} available`
                : 'Checked out'}
            </span>

            {effectiveVariant === 'saved' && (
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                In Ledger
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 border-t border-border/60 pt-2.5">
        <Link
          href={bookUrl}
          className="inline-flex w-full items-center justify-between text-xs font-semibold text-primary transition hover:text-primary-dark"
        >
          <span className="tracking-wide">View Edition</span>

          <ArrowRight
            size={13}
            className="transition duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
