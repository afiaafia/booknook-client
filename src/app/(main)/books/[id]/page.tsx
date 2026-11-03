import { Suspense } from 'react';
import type { Metadata } from 'next';

import BookDetail from '@/components/books/book-detail';

export const metadata: Metadata = { title: 'Book Details' };

async function BookDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookDetail id={id} />;
}

function BookDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
      <div className="mx-auto grid max-w-6xl animate-pulse gap-10 lg:grid-cols-2">
        <div className="mx-auto aspect-[3/4] w-full max-w-md rounded-sm bg-surface-secondary" />
        <div className="space-y-5">
          <div className="h-4 w-28 rounded bg-border" />
          <div className="h-10 w-4/5 rounded bg-border" />
          <div className="h-5 w-2/5 rounded bg-border" />
          <div className="h-24 rounded bg-border" />
        </div>
      </div>
    </main>
  );
}

export default function BookDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<BookDetailsSkeleton />}>
      <BookDetailsContent params={params} />
    </Suspense>
  );
}
