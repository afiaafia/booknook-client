import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary-accent text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-serif text-xl font-semibold"
        >
          <BookOpen className="h-5 w-5 text-brass" aria-hidden="true" />
          BookNook
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-primary-foreground/75">
          <Link href="/books" className="transition hover:text-brass">
            All Books
          </Link>
          <Link href="/dashboard" className="transition hover:text-brass">
            My Borrows
          </Link>
          <span className="text-xs uppercase tracking-[0.12em] text-primary-foreground/55">
            Stories move between us.
          </span>
        </div>
      </div>
    </footer>
  );
}
