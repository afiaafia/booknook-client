'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Search } from 'lucide-react';

import BookCard from '@/components/books/book-card';
import {
  BOOK_CATEGORIES,
  getBooks,
  type Book,
  type BookSort,
  type Pagination,
} from '@/lib/api';

const BOOK_SORTS = ['newest', 'oldest', 'title-asc', 'title-desc'] as const;

const SORT_LABELS: Record<BookSort, string> = {
  newest: 'Recently added',
  oldest: 'Oldest first',
  'title-asc': 'Title A to Z',
  'title-desc': 'Title Z to A',
};


interface DropdownFilterProps {
  label: string;
  value: string;
  options: readonly string[];
  ariaLabel: string;
  onChange: (value: string) => void;
}

function DropdownFilter({
  label,
  value,
  options,
  ariaLabel,
  onChange,
}: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={[
          'flex w-full min-w-0 items-center justify-between gap-3',
          'rounded-full border border-border/80 bg-background',
          'px-4 py-3.5 text-left',
          'transition-all duration-300',
          'hover:-translate-y-0.5 hover:border-primary/50',
          'hover:shadow-[0_5px_16px_rgb(var(--shadow-color)/0.08)]',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary/30',
          isOpen ? 'border-primary/60 shadow-md' : '',
        ].join(' ')}
      >
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          {label}
        </span>

        <span className="min-w-0 flex-1 truncate text-right text-sm font-medium text-foreground">
          {value}
        </span>

        <ChevronDown
          size={17}
          aria-hidden="true"
          className={[
            'shrink-0 text-muted transition-transform duration-300',
            isOpen ? 'rotate-180 text-primary' : '',
          ].join(' ')}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={[
            'absolute left-0 top-full z-50 mt-2.5 w-full',
            'max-h-72 overflow-y-auto overscroll-contain',
            'rounded-2xl border border-border/80',
            'bg-background p-2',
            'shadow-[0_16px_42px_rgb(var(--shadow-color)/0.16)]',
            'animate-in fade-in slide-in-from-top-1 duration-150',
          ].join(' ')}
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={[
                  'flex w-full items-center justify-between gap-3',
                  'rounded-xl px-3.5 py-3 text-left text-sm',
                  'transition-all duration-200',
                  selected
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-surface-secondary hover:text-primary',
                ].join(' ')}
              >
                <span className="min-w-0 truncate">{option}</span>

                {selected && (
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BookBrowserSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] rounded-sm bg-surface-secondary" />
          <div className="mt-4 h-4 w-4/5 rounded bg-border" />
          <div className="mt-2 h-3 w-2/3 rounded bg-border" />
          <div className="mt-3 h-3 w-1/2 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

interface BookListState {
  requestKey: string;
  books: Book[];
  pagination: Pagination | null;
  error?: string;
}

export default function BookBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const categoryParam = searchParams.get('category');
  const category = BOOK_CATEGORIES.find((value) => value === categoryParam);
  const sortParam = searchParams.get('sort');
  const sort = BOOK_SORTS.find((value) => value === sortParam) ?? 'newest';
  const page = parsePage(searchParams.get('page'));
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = JSON.stringify([
    page,
    search,
    category,
    sort,
    reloadCount,
  ]);

  const [searchDraft, setSearchDraft] = useState({ search, value: search });
  const [listState, setListState] = useState<BookListState | null>(null);
  const currentListState =
    listState?.requestKey === requestKey ? listState : null;
  const searchInput =
    searchDraft.search === search ? searchDraft.value : search;
  const books = currentListState?.books ?? [];
  const pagination = currentListState?.pagination ?? null;
  const error = currentListState?.error ?? null;
  const isLoading = currentListState === null;

  useEffect(() => {
    let active = true;

    getBooks({
      page,
      search: search || undefined,
      category,
      sort,
    })
      .then((result) => {
        if (!active) return;
        setListState({ requestKey, ...result });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setListState({
          requestKey,
          books: [],
          pagination: null,
          error:
            requestError instanceof Error
              ? requestError.message
              : "We couldn't load the book collection.",
        });
      });

    return () => {
      active = false;
    };
  }, [page, search, category, sort, reloadCount, requestKey]);

  function updateQuery(changes: Record<string, string | number | null>) {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') nextParams.delete(key);
      else nextParams.set(key, String(value));
    }

    const query = nextParams.toString();
    router.replace(query ? `/books?${query}` : '/books', { scroll: false });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || null, page: null });
  }

  return (
    <main className="reading-room-paper min-h-[calc(100vh-68px)] text-foreground">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brass">
            The BookNook collection
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground sm:text-6xl">
            Find your next read.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
            Explore a collection of stories, ideas, and perspectives worth discovering.
          </p>
        </div>

        <div className="relative z-30 mt-10 grid gap-3 rounded-3xl border border-border/70 bg-surface/75 p-3 shadow-[0_8px_28px_rgb(var(--shadow-color)/0.055)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_12px_34px_rgb(var(--shadow-color)/0.09)] md:grid-cols-[minmax(0,1fr)_220px_220px] md:gap-3 md:p-4">
          <form
            onSubmit={handleSearch}
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-background px-3 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_4px_14px_rgb(var(--shadow-color)/0.06)] focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/10"
          >
            <Search
              className="shrink-0 text-muted transition-colors duration-300 group-focus-within:text-primary"
              size={19}
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchDraft({ search, value: event.target.value })
              }
              placeholder="Search title or author"
              aria-label="Search books by title or author"
              className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted/65"
            />

            <button
              type="submit"
              className="shrink-0 rounded-xl border border-primary bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-dark hover:bg-primary-dark hover:shadow-md active:translate-y-0"
            >
              Search
            </button>
          </form>

          <DropdownFilter
            label="Category"
            value={category ?? 'All categories'}
            options={['All categories', ...BOOK_CATEGORIES]}
            ariaLabel="Filter by category"
            onChange={(value) =>
              updateQuery({
                category: value === 'All categories' ? null : value,
                page: null,
              })
            }
          />

          <DropdownFilter
            label="Sort"
            value={SORT_LABELS[sort]}
            options={BOOK_SORTS.map((item) => SORT_LABELS[item])}
            ariaLabel="Sort books"
            onChange={(value) => {
              const selectedSort = BOOK_SORTS.find(
                (item) => SORT_LABELS[item] === value,
              );

              if (selectedSort) {
                updateQuery({ sort: selectedSort, page: null });
              }
            }}
          />
        </div>

        <div className="mt-7 flex min-h-8 items-center justify-between gap-4 border-b border-border/70 pb-3 text-sm text-muted">
          <p>
            {isLoading
              ? 'Loading the collection...'
              : pagination
                ? `${pagination.total} ${pagination.total === 1 ? 'book' : 'books'}`
                : 'Book collection'}
          </p>
          {search && !isLoading && (
            <button
              type="button"
              onClick={() => updateQuery({ search: null, page: null })}
              className="font-medium text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        <div className="mt-5">
          {isLoading ? (
            <BookBrowserSkeleton />
          ) : error ? (
            <div className="border-y border-border py-14 text-center">
              <h2 className="text-lg font-semibold">
                The shelves aren't loading
              </h2>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={() => setReloadCount((count) => count + 1)}
                className="mt-5 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
              >
                Try again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="border-y border-border py-16 text-center">
              <BookOpen
                className="mx-auto h-10 w-10 text-primary"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-xl font-semibold">
                {search || category
                  ? 'No books match those filters'
                  : 'The collection is waiting to grow'}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {search || category
                  ? 'Try a different title, author, or category.'
                  : 'There are no books to show just yet.'}
              </p>
              {(search || category) && (
                <button
                  type="button"
                  onClick={() =>
                    updateQuery({ search: null, category: null, page: null })
                  }
                  className="mt-5 font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {books.map((book) => (
                <BookCard key={book._id} book={book} variant="catalogue" />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && pagination && pagination.totalPages > 1 && (
          <nav
            aria-label="Book results pages"
            className="mt-12 flex items-center justify-between border-t border-border/70 pt-6"
          >
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => updateQuery({ page: page - 1 })}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <p className="text-sm text-muted">
              Page{' '}
              <span className="font-semibold text-foreground">
                {pagination.page}
              </span>{' '}
              of {pagination.totalPages}
            </p>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => updateQuery({ page: page + 1 })}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
