import Link from 'next/link';
import Image from 'next/image';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary-accent text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-10 w-9 items-center justify-center border border-primary">
            <Image
              src="/images/booknook-logo.png"
              alt="BookNook logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </span>

          <span className="block">
            <span className="block font-serif text-xl font-semibold leading-none">
              BookNook
            </span>
            <span className="mt-1 block text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">
              The Modern Bindery
            </span>
          </span>
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
