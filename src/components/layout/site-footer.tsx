import Link from 'next/link';
import Image from 'next/image';
import {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaGithub,
} from 'react-icons/fa6';
import { FiArrowUpRight, FiMail } from 'react-icons/fi';

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
    <footer className="mx-auto mb-6 mt-10 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-[#E8DFD0] bg-[#F8F5EE] text-[#40382F] shadow-[0_12px_40px_rgba(80,60,35,0.06)] sm:mb-8 sm:w-[calc(100%-3rem)] dark:border-[#39342C] dark:bg-[#151411] dark:text-[#F0EAE0] dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="mx-auto max-w-7xl px-5 pb-6 pt-12 sm:px-8 sm:pt-14 lg:pt-16">

        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr] lg:gap-16">

          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="BookNook home"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DCCDB5] bg-white/60 transition-all duration-300 group-hover:border-[#B59662] group-hover:bg-white dark:border-[#514638] dark:bg-white/5 dark:group-hover:bg-white/10">
                <Image
                  src="/images/booknook-logo.png"
                  alt="BookNook logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </span>

              <span>
                <span className="block font-serif text-2xl font-semibold leading-none tracking-tight">
                  BookNook
                </span>
                <span className="mt-1.5 block text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#9A8059] dark:text-[#C3A879]">
                  The Modern Bindery
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#776D60] dark:text-[#B0A699]">
              A thoughtful space for readers to discover stories,
              explore new perspectives, and find their next favorite book.
            </p>

            <p className="mt-5 font-serif text-sm italic text-[#A18A68] dark:text-[#C1A77D]">
              Every book opens another world.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Explore
            </h3>

            <div className="mt-5 h-px w-8 bg-[#B99A68]" />

            <nav
              aria-label="Footer navigation"
              className="mt-5 flex flex-col items-start gap-3.5"
            >
              {navigationLinks.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="group inline-flex items-center gap-1.5 text-sm text-[#776D60] transition-colors duration-200 hover:text-[#A17D43] dark:text-[#B0A699] dark:hover:text-[#D5B77F]"
                >
                  <span>{name}</span>
                  <FiArrowUpRight
                    size={13}
                    className="opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact and social links */}
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Stay Connected
            </h3>

            <div className="mt-5 h-px w-8 bg-[#B99A68]" />

            <p className="mt-5 max-w-xs text-sm leading-6 text-[#776D60] dark:text-[#B0A699]">
              Questions, suggestions, or just want to talk about books?
              Get in touch.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="group mt-4 inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#78603C] transition-colors hover:text-[#A17D43] dark:text-[#D0B384] dark:hover:text-[#E5C99B]"
            >
              <FiMail size={16} className="shrink-0" aria-hidden="true" />
              <span className="break-all">{supportEmail}</span>
            </a>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${name}`}
                  title={name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED3C1] text-[#766A5B] transition-all duration-300 hover:-translate-y-1 hover:border-[#B99A68] hover:bg-[#B99A68] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B99A68] dark:border-[#494136] dark:text-[#C2B7A7] dark:hover:border-[#B99A68] dark:hover:bg-[#B99A68] dark:hover:text-[#17140F]"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#E5DCCE] pt-5 text-center sm:flex-row sm:text-left dark:border-[#39342C]">
          <p className="text-xs tracking-wide text-[#948878] dark:text-[#948A7D]">
            © {new Date().getFullYear()} BookNook. All rights reserved.
          </p>

          <p className="font-serif text-xs italic tracking-wide text-[#A18A68] dark:text-[#BCA47D]">
            A little corner for every reader.
          </p>
        </div>

      </div>
    </footer>
  );
}
