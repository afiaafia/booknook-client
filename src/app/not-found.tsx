import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-68px)] items-center justify-center bg-background px-5 py-16 text-foreground">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-border bg-surface-secondary text-primary">
          <BookOpen className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-accent">
          Page not found
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          This page isn't on our shelves.
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted">
          The address may be outdated, or the page may have moved. Head home or
          browse the collection to find your way.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-border bg-surface px-5 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Home
          </Link>
          <Link
            href="/books"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
          >
            Browse books
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
