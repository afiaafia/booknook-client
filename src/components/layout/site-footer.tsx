import Link from 'next/link';
import Image from 'next/image';
import {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaGithub,
} from 'react-icons/fa6';

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/itsafia220',
    Icon: FaFacebookF,
  },
  {
    name: 'X',
    href: 'https://x.com/afia_codes',
    Icon: FaXTwitter,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/afia-afia',
    Icon: FaLinkedinIn,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/afia.220?rpxt=MXdnYmFsenA2dnNraA==',
    Icon: FaInstagram,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/afiaafia',
    Icon: FaGithub,
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary-accent text-primary-foreground">

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        <div className="flex flex-col items-center justify-between gap-9 lg:flex-row">

          {/* Brand */}
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-3"
          >
            <span className="flex h-12 w-11 items-center justify-center border border-primary transition duration-300 group-hover:bg-primary/10">
              <Image
                src="/images/booknook-logo.png"
                alt="BookNook logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </span>

            <span>
              <span className="block font-serif text-2xl font-semibold leading-none">
                BookNook
              </span>
              <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground/65">
                The Modern Bindery
              </span>
            </span>
          </Link>

          {/* Navigation and tagline */}
          <div className="flex flex-col items-center gap-3 text-center">
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/"
                className="transition-colors hover:text-brass"
              >
                Home
              </Link>

              <Link
                href="/books"
                className="transition-colors hover:text-brass"
              >
                All Books
              </Link>

              <Link
                href="/dashboard"
                className="transition-colors hover:text-brass"
              >
                My Borrows
              </Link>
            </nav>

            <p className="font-serif text-sm italic tracking-wide text-primary-foreground/70">
              Stories move between us.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-2.5">
            {socialLinks.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit BookNook on ${name}`}
                title={name}
                className="group flex h-10 w-10 items-center justify-center border border-primary-foreground/25 text-primary-foreground/85 transition-all duration-300 hover:-translate-y-1 hover:border-brass hover:bg-brass hover:text-secondary-accent"
              >
                <Icon
                  size={17}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </a>
            ))}
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-9 border-t border-primary-foreground/20 pt-5">
          <p className="text-center text-[0.68rem] tracking-wide text-primary-foreground/55">
            © {new Date().getFullYear()} BookNook. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
