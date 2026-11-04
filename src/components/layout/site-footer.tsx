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

const navigationLinks = [
  { name: 'Home', href: '/' },
  { name: 'Browse Books', href: '/books' },
  { name: 'My Reading Corner', href: '/dashboard' },
];

const supportEmail = 'afiastudent461@gmail.com';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary-accent text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-12 w-11 shrink-0 items-center justify-center border border-primary transition duration-300 group-hover:bg-primary/10">
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

            <p className="mt-5 max-w-xs text-sm leading-7 text-primary-foreground/70">
              A little corner for every reader. Discover stories,
              explore new worlds, and keep your favorite books close.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Explore
            </h3>

            <nav
              aria-label="Footer navigation"
              className="mt-5 flex flex-col items-start gap-3 text-sm text-primary-foreground/70"
            >
              {navigationLinks.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="transition-colors hover:text-brass"
                >
                  {name}
                </Link>
              ))}

              <a
                href={`mailto:${supportEmail}`}
                className="transition-colors hover:text-brass"
              >
                Contact
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Get in Touch
            </h3>

            <p className="mt-5 text-sm leading-6 text-primary-foreground/65">
              Have a question or need assistance? We'd love to hear from you.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 inline-block break-all text-sm font-medium text-primary-foreground transition-colors hover:text-brass"
            >
              {supportEmail}
            </a>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Follow BookNook
            </h3>

            <p className="mt-5 text-sm leading-6 text-primary-foreground/65">
              Stay connected and share your love for reading.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
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

        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-primary-foreground/20 pt-6">
          <p className="text-center text-xs tracking-wide text-primary-foreground/55">
            © 2026 BookNook. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
