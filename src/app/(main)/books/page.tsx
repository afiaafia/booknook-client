import { Suspense } from 'react';
import type { Metadata } from 'next';

import BookBrowser, {
  BookBrowserSkeleton,
} from '@/components/books/book-browser';

export const metadata: Metadata = { title: 'All Books' };

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <BookBrowserSkeleton />
          </div>
        </main>
      }
    >
      <BookBrowser />
    </Suspense>
  );
}
