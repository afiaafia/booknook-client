'use client';

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import BorrowingJourney from './borrowing-journey';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

import { A11y, Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';

import {
  BOOK_CATEGORIES,
  getBooks,
  getLatestBooks,
  type Book,
  type BookCategory,
} from '@/lib/api';
import {
  EMPTY_READING_LIST,
  getSavedBookIds,
  subscribeToSavedBookIds,
  toggleSavedBook as toggleSavedBookId,
} from '@/lib/reading-list';

const COLLECTIONS: {
  category: BookCategory;
  title: string;
  description: string;
  note: string;
}[] = [
  {
    category: 'Fiction',
    title: 'A world between covers',
    description: 'For the afternoons that deserve to last a little longer.',
    note: 'Fiction shelf',
  },
  {
    category: 'History',
    title: 'The long view',
    description: 'Lives, places, and ideas that shaped the way here.',
    note: 'History shelf',
  },
  {
    category: 'Science',
    title: 'A curious mind',
    description: 'Big questions, new discoveries, and other open doors.',
    note: 'Science shelf',
  },
];

function BookCover({
  book,
  className = '',
}: {
  book: Book;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`reading-room-cover relative aspect-[3/4] overflow-hidden rounded-sm bg-surface-secondary ${className}`}
    >
      {book.image && !hasError ? (
        <Image
          src={book.image}
          alt={`Cover of ${book.title}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 26vw, 18vw"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={`No cover available for ${book.title}`}
          className="flex h-full flex-col items-center justify-center gap-3 bg-surface-secondary px-4 text-center text-secondary-accent"
        >
          <BookOpen size={34} strokeWidth={1.2} aria-hidden="true" />
          <span className="font-serif text-lg leading-tight text-foreground">
            {book.title}
          </span>
        </div>
      )}
    </div>
  );
}


function BookActionCard({
  book,
  saved,
  onToggleSave,
  compact = false,
}: {
  book: Book;
  saved: boolean;
  onToggleSave: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <article className="reading-room-book group min-w-0">
      <div className="relative">
        <Link
          href={`/books/${encodeURIComponent(book._id)}`}
          aria-label={`View ${book.title} by ${book.author}`}
          className="block"
        >
          <BookCover
            book={book}
            className={compact ? 'reading-room-cover--compact' : ''}
          />
        </Link>
        <button
          type="button"
          onClick={() => onToggleSave(book._id)}
          aria-label={
            saved
              ? `Remove ${book.title} from saved books`
              : `Save ${book.title}`
          }
          aria-pressed={saved}
          className="reading-room-save absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-offset-2"
        >
          {saved ? (
            <BookmarkCheck size={18} aria-hidden="true" />
          ) : (
            <Bookmark size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="pt-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-secondary-accent">
          {book.category}
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-xl leading-tight text-foreground">
          {book.title}
        </h3>
        <p className="mt-1 truncate text-sm text-muted">{book.author}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/80 pt-3">
          <span
            className={`text-xs font-medium ${
              book.availableCopies > 0
                ? 'text-status-success'
                : 'text-status-danger'
            }`}
          >
            {book.availableCopies > 0
              ? `${book.availableCopies} available`
              : 'All copies borrowed'}
          </span>
          <Link
            href={`/books/${encodeURIComponent(book._id)}`}
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary-dark"
          >
            Borrow <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText = 'Explore all',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="reading-room-section-heading flex flex-wrap items-end justify-between gap-5 border-b border-border pb-5">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-accent">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-4xl font-medium leading-none text-foreground sm:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3 hover:text-primary-dark"
        >
          {linkText} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}



const HERO_MESSAGES = [
  {
    variant: 'discover',
    eyebrow: 'THE ART OF FINDING YOUR NEXT READ',
    image: '/images/banners/banner-discover-normalized.png',
    title: 'A new world is waiting',
    emphasis: 'between pages.',
    description: 'Discover remarkable stories, explore new subjects, and find a book worth remembering.',
    cta: 'Discover Books',
    href: '/books',
  },
  {
    variant: 'collections',
    eyebrow: 'CURATED FOR EVERY CURIOSITY',
    image: '/images/banners/banner-explore-normalized.png',
    title: 'Find a shelf that feels',
    emphasis: 'like yours.',
    description: 'Explore Fiction and discover stories selected for every kind of curious reader.',
    cta: 'Explore Fiction',
    href: '/books?category=Fiction',
  },
  {
    variant: 'arrivals',
    eyebrow: 'FRESH FROM THE SHELVES',
    image: '/images/banners/banner-share-normalized.png',
    title: 'Make room for your next',
    emphasis: 'favorite.',
    description: 'There is always another story to discover. Explore the books waiting on our shelves.',
    cta: 'Browse Books',
    href: '/books',
  },
] as const;

function HeroMessageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <section
      className="reading-room-message-carousel"
      aria-label="BookNook featured banners"
      aria-roledescription="carousel"
    >
      <Suspense
        fallback={
          <div className="reading-room-message-swiper reading-room-message-swiper-fallback">
            <div className="reading-room-image-slide reading-room-image-slide--active reading-room-image-slide--discover">
              <div
                className="reading-room-image-slide-photo"
                style={{ backgroundImage: `url("${HERO_MESSAGES[0].image}")` }}
                aria-hidden="true"
              />
              <div className="reading-room-image-slide-overlay" />
              <div className="reading-room-image-slide-content">
                <p className="reading-room-message-eyebrow">
                  <span aria-hidden="true" />
                  {HERO_MESSAGES[0].eyebrow}
                </p>
                <h1 className="reading-room-message-title">
                  {HERO_MESSAGES[0].title} <em>{HERO_MESSAGES[0].emphasis}</em>
                </h1>
                <p className="reading-room-message-description">
                  {HERO_MESSAGES[0].description}
                </p>
                <Link href={HERO_MESSAGES[0].href} className="reading-room-message-cta">
                  {HERO_MESSAGES[0].cta} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        }
      >
      <Swiper
        modules={[A11y, Autoplay]}
        direction="horizontal"
        slidesPerView={1}
        spaceBetween={0}
        speed={reducedMotion ? 0 : 850}
        loop={HERO_MESSAGES.length > 1}
        autoplay={
          reducedMotion
            ? false
            : {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
        }
        grabCursor
        watchOverflow
        className="reading-room-message-swiper"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setActiveIndex(swiper.realIndex);
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
        }}
        a11y={{
          prevSlideMessage: 'Previous banner',
          nextSlideMessage: 'Next banner',
        }}
      >
        {HERO_MESSAGES.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <SwiperSlide key={slide.image}>
              <div
                className={`reading-room-image-slide reading-room-image-slide--${slide.variant}${
                  isActive ? ' reading-room-image-slide--active' : ''
                }`}
                aria-hidden={!isActive}
                inert={!isActive}
              >
                <div
                  className="reading-room-image-slide-photo"
                  style={{ backgroundImage: `url("${slide.image}")` }}
                  aria-hidden="true"
                />

                <div className="reading-room-image-slide-overlay" />

                <div className="reading-room-image-slide-content">
                  <p className="reading-room-message-eyebrow">
                    <span aria-hidden="true" />
                    {slide.eyebrow}
                  </p>

                  {index === 0 ? (
                    <h1 className="reading-room-message-title">
                      {slide.title} <em>{slide.emphasis}</em>
                    </h1>
                  ) : (
                    <h2 className="reading-room-message-title">
                      {slide.title} <em>{slide.emphasis}</em>
                    </h2>
                  )}

                  <p className="reading-room-message-description">
                    {slide.description}
                  </p>

                  <Link href={slide.href} className="reading-room-message-cta">
                    {slide.cta} <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      </Suspense>

      <div
        className="reading-room-message-pagination"
        role="group"
        aria-label="Choose featured banner"
        style={{
          position: 'absolute',
          zIndex: 10,
          left: '50%',
          bottom: '1.25rem',
          display: 'flex',
          width: 'max-content',
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.7rem',
          margin: 0,
          transform: 'translateX(-50%)',
        }}
      >
        {HERO_MESSAGES.map((slide, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={slide.image}
              type="button"
              onClick={() => swiperRef.current?.slideToLoop(index)}
              aria-label={`Go to banner ${index + 1}`}
              aria-pressed={isActive}
              className="reading-room-message-dot"
              style={{
                appearance: 'none',
                display: 'block',
                flex: isActive ? '0 0 34px' : '0 0 9px',
                width: isActive ? 34 : 9,
                height: 5,
                minWidth: isActive ? 34 : 9,
                padding: 0,
                border: 0,
                borderRadius: '999px',
                background: isActive ? '#D4AF6A' : 'rgba(139, 113, 87, 0.75)',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 10px rgba(212, 175, 106, 0.28)' : 'none',
                transition: 'width 350ms ease, flex-basis 350ms ease, background-color 350ms ease, box-shadow 350ms ease',
              }}            />
          );
        })}
      </div>
    </section>
  );
}
function CoverComposition({ books }: { books: Book[] }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);

    updatePreference();
    media.addEventListener('change', updatePreference);

    return () => media.removeEventListener('change', updatePreference);
  }, []);

  if (books.length === 0) {
    return (
      <div
        className="reading-room-hero-art reading-room-hero-art--empty"
        aria-hidden="true"
      >
        <div className="reading-room-empty-book">
          <BookOpen size={70} strokeWidth={1} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="reading-room-hero-art"
      aria-label="Explore books from the collection"
    >
      <Swiper
        modules={[A11y, Autoplay]}
        direction="horizontal"
        slidesPerView={3}
        centeredSlides
        centeredSlidesBounds={false}
        spaceBetween={12}
        speed={1400}
        loop={books.length >= 4}
        rewind={books.length > 1 && books.length < 4}
        autoplay={
          books.length > 1 && !prefersReducedMotion
            ? {
                delay: 2600,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        grabCursor
        watchOverflow
        className="reading-room-hero-swiper"
        a11y={{
          prevSlideMessage: 'Previous book',
          nextSlideMessage: 'Next book',
        }}
      >
        {books.map((book) => (
          <SwiperSlide key={book._id}>
            <div className="reading-room-hero-slide">
              <Link
  href={`/books/${encodeURIComponent(book._id)}`}
  aria-label={`View details for ${book.title}`}
  className="block"
>
  <BookCover book={book} />
</Link>
              <p className="reading-room-hero-caption">
                <span className="reading-room-hero-book-title">
                  {book.title}
                </span>
                <span className="reading-room-hero-book-author">
                  {book.author}
                </span>
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function LoadingBookGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] rounded-sm bg-surface-secondary" />
          <div className="mt-4 h-3 w-20 rounded bg-surface-secondary" />
          <div className="mt-3 h-5 w-4/5 rounded bg-surface-secondary" />
          <div className="mt-2 h-4 w-2/3 rounded bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

export default function HomeReadingRoom() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredSwiperRef = useRef<SwiperInstance | null>(null);
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestHasError, setLatestHasError] = useState(false);
  const [latestReloadCount, setLatestReloadCount] = useState(0);
  const savedBooks = useSyncExternalStore(
    subscribeToSavedBookIds,
    getSavedBookIds,
    () => EMPTY_READING_LIST
  );

  useEffect(() => {
    let active = true;

    getBooks({ page: 1, limit: 50, sort: 'newest' })
      .then(({ books: result }) => {
        if (!active) return;
        setBooks(result);
        setHasError(false);
      })
      .catch(() => {
        if (!active) return;
        setBooks([]);
        setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadCount]);

  useEffect(() => {
    let active = true;

    getLatestBooks()
      .then((result) => {
        if (!active) return;
        setLatestBooks(result);
        setLatestHasError(false);
      })
      .catch(() => {
        if (!active) return;
        setLatestBooks([]);
        setLatestHasError(true);
      })
      .finally(() => {
        if (active) setLatestLoading(false);
      });

    return () => {
      active = false;
    };
  }, [latestReloadCount]);



  return (
    <div className="reading-room-paper overflow-hidden">
      <section className="reading-room-hero reading-room-reveal">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:py-20">
          <div className="relative z-10 w-full">
                        <HeroMessageCarousel />

          </div>

        </div>
      </section>

      <section
        id="new-arrivals"
        className="reading-room-reveal px-5 py-10 sm:px-8 sm:py-14"
      >
        <div className="mx-auto max-w-7xl rounded-3xl border border-border bg-surface px-5 py-8 shadow-sm overflow-hidden sm:px-8 sm:py-10 lg:px-10">
          <SectionHeading
            eyebrow="Fresh from the shelves"
            title="New Arrivals"
            description="The latest books added to the community collection."
            href="/books?sort=newest"
            linkText="See every title"
          />
          <div className="mt-9">
            {latestLoading ? (
              <LoadingBookGrid />
            ) : latestBooks.length > 0 ? (
              <div className="reading-room-arrivals">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    <span className="font-mono text-secondary-accent">
                      {String(latestBooks.length).padStart(2, '0')}
                    </span>
                    {' '}titles on this shelf
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="new-arrivals-prev reading-room-carousel-arrow"
                      aria-label="Previous books"
                    >
                      <ChevronLeft size={19} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="new-arrivals-next reading-room-carousel-arrow"
                      aria-label="Next books"
                    >
                      <ChevronRight size={19} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <Swiper
                  modules={[Navigation, A11y, Autoplay]}
                  navigation={{
                    prevEl: '.new-arrivals-prev',
                    nextEl: '.new-arrivals-next',
                  }}
                  slidesPerView={2}
                  spaceBetween={16}
                  speed={650}
                  autoplay={{
                    delay: 3200,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  rewind
                  grabCursor
                  watchOverflow
                  a11y={{
                    prevSlideMessage: 'Previous books',
                    nextSlideMessage: 'Next books',
                  }}
                  breakpoints={{
                    640: {
                      slidesPerView: 3,
                      spaceBetween: 22,
                    },
                    1024: {
                      slidesPerView: 5,
                      spaceBetween: 24,
                    },
                  }}
                  className="reading-room-arrivals-swiper"
                >
                  {latestBooks.map((book) => (
                    <SwiperSlide key={book._id} className="h-auto">
                      <BookActionCard
                        book={book}
                        saved={savedBooks.includes(book._id)}
                        onToggleSave={toggleSavedBookId}
                        compact
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <BooksEmptyState
                hasError={latestHasError}
                onRetry={() => {
                  setLatestLoading(true);
                  setLatestReloadCount((count) => count + 1);
                }}
              />
            )}
          </div>
        </div>
      </section>

      <BorrowingJourney />

      <section className="reading-room-featured border-y border-border bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="The curator's selection"
            title="Stories Worth Discovering"
            description="A considered collection of books selected for curious minds."
          />
          {isLoading ? (
            <div className="mt-8 grid animate-pulse gap-8 md:grid-cols-[minmax(12rem,0.65fr)_1fr]">
              <div className="aspect-[3/4] max-w-xs bg-surface-secondary" />
              <div className="space-y-4 py-8">
                <div className="h-4 w-28 bg-surface-secondary" />
                <div className="h-12 w-3/4 bg-surface-secondary" />
                <div className="h-5 w-1/2 bg-surface-secondary" />
                <div className="h-24 bg-surface-secondary" />
              </div>
            </div>
          ) : books.length > 0 ? (
            <div className="reading-room-featured-slideshow mt-8">
              <Swiper
                modules={[A11y, Autoplay]}
                slidesPerView={1}
                spaceBetween={24}
                speed={750}
                loop={books.length > 1}
                autoplay={
                  books.length > 1
                    ? {
                        delay: 4500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                    : false
                }
                grabCursor
                watchOverflow
                className="reading-room-featured-swiper"
                onSwiper={(swiper) => {
                  featuredSwiperRef.current = swiper;
                  setFeaturedIndex(swiper.realIndex);
                }}
                onSlideChange={(swiper) => setFeaturedIndex(swiper.realIndex)}
                a11y={{
                  prevSlideMessage: 'Previous featured book',
                  nextSlideMessage: 'Next featured book',
                }}
              >
                {books.slice(0, 5).map((book, index) => (
                  <SwiperSlide key={book._id}>
                    <article className="reading-room-feature-slide">
                      <div className="reading-room-feature-art">
                        <span className="reading-room-feature-edition">
                          BOOKNOOK · FEATURED EDITION
                        </span>
                        <Link
                          href={`/books/${encodeURIComponent(book._id)}`}
                          className="reading-room-feature-cover-link"
                          aria-label={`View ${book.title} by ${book.author}`}
                        >
                          <BookCover book={book} />
                        </Link>
                        <span className="reading-room-feature-index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="reading-room-feature-details">
                        <p className="reading-room-feature-category">
                          <span aria-hidden="true">✦</span>
                          {book.category}
                        </p>

                        <h3 className="reading-room-feature-title">
                          {book.title}
                        </h3>

                        <p className="reading-room-feature-author">
                          by {book.author}
                        </p>

                        <p className="reading-room-feature-description">
                          {book.description || 'A new story awaits discovery on the BookNook shelves.'}
                        </p>

                        <div className="reading-room-feature-availability">
                          <span
                            className={
                              book.availableCopies > 0
                                ? 'reading-room-feature-availability-dot is-available'
                                : 'reading-room-feature-availability-dot'
                            }
                            aria-hidden="true"
                          />
                          {book.availableCopies > 0
                            ? `${book.availableCopies} of ${book.totalCopies} copies available`
                            : 'Currently on loan'}
                        </div>

                        <Link
                          href={`/books/${encodeURIComponent(book._id)}`}
                          className="reading-room-feature-cta"
                        >
                          Discover this book
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>

                      <span className="reading-room-feature-watermark" aria-hidden="true">
                        B.
                      </span>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="reading-room-feature-controls">
                <div className="reading-room-feature-pagination" role="group" aria-label="Choose featured book">
                  {books.slice(0, 5).map((book, index) => (
                    <button
                      key={book._id}
                      type="button"
                      onClick={() => featuredSwiperRef.current?.slideToLoop(index)}
                      className={`reading-room-feature-pagination-dot${featuredIndex === index ? ' is-active' : ''}`}
                      aria-label={`Show featured book ${index + 1}: ${book.title}`}
                      aria-pressed={featuredIndex === index}
                    />
                  ))}
                </div>

                <span className="reading-room-feature-counter" aria-live="polite">
                  {String(featuredIndex + 1).padStart(2, '0')}
                  <span aria-hidden="true"> / </span>
                  {String(Math.min(books.length, 5)).padStart(2, '0')}
                </span>

                <div className="reading-room-feature-arrows">
                  <button
                    type="button"
                    onClick={() => featuredSwiperRef.current?.slidePrev()}
                    aria-label="Previous featured book"
                    className="reading-room-feature-arrow"
                    disabled={books.length < 2}
                  >
                    <ChevronLeft size={19} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => featuredSwiperRef.current?.slideNext()}
                    aria-label="Next featured book"
                    className="reading-room-feature-arrow"
                    disabled={books.length < 2}
                  >
                    <ChevronRight size={19} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>          ) : (
            <BooksEmptyState
              hasError={hasError}
              onRetry={() => setReloadCount((count) => count + 1)}
            />
          )}
        </div>
      </section>



      <section className="reading-room-collections border-y border-border bg-surface/70 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="A few paths through the shelves"
            title="Curated Collections"
            description="Start with a subject, then follow the book that catches your eye."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3 md:gap-5">
            {COLLECTIONS.map((collection, index) => {
              const book = books.find(
                (item) => item.category === collection.category
              );
              const count = books.filter(
                (item) => item.category === collection.category
              ).length;

              return (
                <Link
                  key={collection.category}
                  href={`/books?category=${encodeURIComponent(collection.category)}`}
                  className={`reading-room-collection reading-room-collection--${index + 1} group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-sm border border-border bg-background p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgb(var(--shadow-color)/0.11)] sm:min-h-72 sm:p-7`}
                >
                  {book && (
                    <div
                      className="reading-room-collection-cover"
                      aria-hidden="true"
                    >
                      <BookCover book={book} />
                    </div>
                  )}
                  <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary-accent">
                    {collection.note}
                  </span>
                  <div className="relative z-10 max-w-[18rem]">
                    <p className="text-xs text-muted">
                      {isLoading
                        ? 'From the collection'
                        : `${count} ${count === 1 ? 'title' : 'titles'}`}
                    </p>
                    <h3 className="mt-2 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
                      {collection.title}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                      {collection.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:gap-3">
                      Enter the shelf{' '}
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="genres"
        className="reading-room-reveal mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-accent">
              Choose a direction
            </p>
            <h2 className="mt-3 max-w-md font-serif text-4xl font-medium leading-tight text-foreground sm:text-5xl">
              What kind of world today?
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted sm:justify-self-end sm:text-base sm:leading-7">
            Browse by the shelf you&apos;re drawn to. Each genre opens the existing
            catalogue with that category selected.
          </p>
        </div>
        <nav
          aria-label="Browse book genres"
          className="mt-8 grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-5"
        >
          {BOOK_CATEGORIES.map((category, index) => {
            const count = books.filter(
              (book) => book.category === category
            ).length;
            return (
              <Link
                key={category}
                href={`/books?category=${encodeURIComponent(category)}`}
                className="reading-room-genre group flex min-h-32 flex-col justify-between border-b border-r border-border p-4 transition hover:bg-surface sm:min-h-36 sm:p-5"
              >
                <span className="text-xs font-medium text-muted">
                  0{index + 1}
                </span>
                <span>
                  <span className="block font-serif text-2xl text-foreground transition group-hover:text-primary sm:text-3xl">
                    {category}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {isLoading
                      ? 'Browse shelf'
                      : `${count} ${count === 1 ? 'book' : 'books'}`}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="reading-room-invitation border-t border-border bg-secondary-accent text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 sm:py-20 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
              The shelves are open
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              There&apos;s always room for one more story.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              Browse the community collection and find a book that feels like it
              was waiting for you.
            </p>
          </div>
          <Link
            href="/books"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 border border-primary-foreground/55 px-5 text-sm font-semibold transition hover:border-brass hover:bg-primary-foreground hover:text-secondary-accent"
          >
            Explore all books <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function BooksEmptyState({
  hasError,
  onRetry,
}: {
  hasError: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="border-y border-border py-12 text-center">
      <BookOpen
        className="mx-auto text-secondary-accent"
        size={30}
        aria-hidden="true"
      />
      <p className="mt-3 font-serif text-2xl text-foreground">
        {hasError
          ? 'The shelves are taking a moment.'
          : 'The shelves are ready for a first title.'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {hasError
          ? 'The collection could not be reached just now.'
          : 'Visit the catalogue to explore the collection.'}
      </p>
      {hasError ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Try again
        </button>
      ) : (
        <Link
          href="/books"
          className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Browse books
        </Link>
      )}
    </div>
  );
}
