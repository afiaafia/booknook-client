'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react';

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
    <main className="min-h-[calc(100vh-68px)] bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            The BookNook collection
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Find your next read
          </h1>
          <p className="mt-3 leading-7 text-muted">
            Browse the shelves by title, author, or category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 border-y border-border py-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 items-center gap-3 border-b border-border bg-surface px-3"
          >
            <Search
              className="shrink-0 text-muted"
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
              className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              className="border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
            >
              Search
            </button>
          </form>

          <label className="flex items-center gap-3 border-b border-border bg-surface px-3 text-sm">
            <span className="shrink-0 text-muted">Category</span>
            <select
              value={category ?? ''}
              onChange={(event) =>
                updateQuery({
                  category: event.target.value || null,
                  page: null,
                })
              }
              className="min-w-0 flex-1 bg-transparent py-3 font-medium outline-none"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {BOOK_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 border-b border-border bg-surface px-3 text-sm">
            <span className="shrink-0 text-muted">Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                updateQuery({ sort: event.target.value, page: null })
              }
              className="min-w-0 flex-1 bg-transparent py-3 font-medium outline-none"
              aria-label="Sort books"
            >
              {BOOK_SORTS.map((item) => (
                <option key={item} value={item}>
                  {SORT_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex min-h-6 items-center justify-between gap-4 text-sm text-muted">
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
                The shelves aren���t loading
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
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && pagination && pagination.totalPages > 1 && (
          <nav
            aria-label="Book results pages"
            className="mt-10 flex items-center justify-between border-t border-border pt-5"
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
