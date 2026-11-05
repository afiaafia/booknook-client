import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display, Geist_Mono, Pinyon_Script } from 'next/font/google';
import { Toaster } from 'sonner';
import SiteNavigation from '@/components/layout/site-navigation';
import SiteFooter from '@/components/layout/site-footer';
import ThemeProvider from '@/components/theme-provider';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const editorial = Playfair_Display({
  variable: '--font-editorial',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const booknookScript = Pinyon_Script({
  variable: '--font-booknook-script',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BookNook | Library Management',
    template: '%s | BookNook',
  },
  description: 'Discover, manage, and borrow books with BookNook.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${geistMono.variable} ${editorial.variable} ${booknookScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Suspense
            fallback={
              <header className="min-h-[68px] border-b border-border bg-surface" />
            }
          >
            <SiteNavigation />
          </Suspense>
          {children}
          <SiteFooter />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
