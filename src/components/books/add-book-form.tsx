'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, LoaderCircle, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  BOOK_CATEGORIES,
  createBook,
  uploadBookImage,
  type BookCategory,
  type CreateBookRequest,
} from '@/lib/api';
import { useSession } from '@/lib/auth-client';

interface AddBookValues {
  title: string;
  author: string;
  category: BookCategory;
  image: string;
  description: string;
  totalCopies: string;
}

const INITIAL_VALUES: AddBookValues = {
  title: '',
  author: '',
  category: BOOK_CATEGORIES[0],
  image: '',
  description: '',
  totalCopies: '1',
};

export default function AddBookForm() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [values, setValues] = useState<AddBookValues>(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(
        `/sign-in?next=${encodeURIComponent('/dashboard/books/new')}`
      );
    }
  }, [isPending, session, router]);

  function updateField<K extends keyof AddBookValues>(
    field: K,
    value: AddBookValues[K]
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.currentTarget.value = '';
    setIsUploading(true);
    setUploadProgress(0);
    setFormError(null);
    try {
      updateField('image', await uploadBookImage(file, setUploadProgress));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'The image upload failed.'
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current || isUploading) return;

    const title = values.title.trim();
    const author = values.author.trim();
    const description = values.description.trim();
    const image = values.image.trim();
    const totalCopies = Number(values.totalCopies);

    if (title.length < 2 || title.length > 150) {
      setFormError('Title must be between 2 and 150 characters.');
      return;
    }

    if (author.length < 2 || author.length > 100) {
      setFormError('Author must be between 2 and 100 characters.');
      return;
    }

    if (!BOOK_CATEGORIES.includes(values.category)) {
      setFormError('Please choose a valid category.');
      return;
    }

    if (!image) {
      setFormError(
        'Please provide an image by uploading a file or entering a URL.'
      );
      return;
    }

    try {
      new URL(image);
    } catch {
      setFormError('Please enter a valid image URL (e.g., https://...).');
      return;
    }

    if (description.length < 10 || description.length > 2000) {
      setFormError('Description must be between 10 and 2000 characters.');
      return;
    }

    if (
      !Number.isInteger(totalCopies) ||
      totalCopies < 1 ||
      totalCopies > 10000
    ) {
      setFormError('Total copies must be a whole number between 1 and 10,000.');
      return;
    }

    const payload: CreateBookRequest = {
      title,
      author,
      category: values.category,
      image,
      description,
      totalCopies,
    };

    inFlightRef.current = true;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await createBook(payload);
      toast.success(`“${title}” has been added to the library collection.`);
      router.push('/dashboard/books');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not create book. Please check your information.';
      setFormError(message);
      toast.error(message);
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (isPending || !session) {
    return (
      <main className="min-h-[calc(100vh-68px)] bg-background px-4 py-7 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-border" />
          <div className="h-8 w-56 rounded bg-border" />
          <div className="h-72 rounded-xl bg-surface" />
        </div>
      </main>
    );
  }

  const previewTitle = values.title.trim() || 'Untitled';
  const previewAuthor = values.author.trim() || 'Author name';
  const previewCategory = values.category;

  return (
    <main className="min-h-[calc(100vh-68px)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/dashboard/books"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-primary"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to My Books
        </Link>

        <header className="mt-4 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              BookNook · Library Catalog
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Add a book to the shelves
            </h1>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
              Share a title with the community. Complete the details below to
              add it to the collection.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            New collection entry
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(250px,0.8fr)] lg:gap-7"
        >
          <div className="min-w-0 space-y-4">
            <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    01 / The book
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold">
                    Basic information
                  </h2>
                </div>
                <BookOpen size={19} className="text-muted" aria-hidden="true" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="book-title" className="text-xs font-medium">
                    Book title <span className="text-status-danger">*</span>
                  </label>
                  <input
                    id="book-title"
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    placeholder="e.g. The Midnight Library"
                    value={values.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="book-author" className="text-xs font-medium">
                    Author name <span className="text-status-danger">*</span>
                  </label>
                  <input
                    id="book-author"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Matt Haig"
                    value={values.author}
                    onChange={(e) => updateField('author', e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="book-category" className="text-xs font-medium">
                    Category <span className="text-status-danger">*</span>
                  </label>
                  <select
                    id="book-category"
                    value={values.category}
                    onChange={(e) =>
                      updateField('category', e.target.value as BookCategory)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {BOOK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="book-copies" className="text-xs font-medium">
                    Total copies <span className="text-status-danger">*</span>
                  </label>
                  <input
                    id="book-copies"
                    type="number"
                    required
                    min={1}
                    max={10000}
                    step={1}
                    placeholder="1"
                    value={values.totalCopies}
                    onChange={(e) => updateField('totalCopies', e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:max-w-40"
                  />
                  <p className="text-[10px] text-muted">
                    Initial available copies will equal the total copies.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-4 border-b border-border pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  02 / The cover
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold">
                  Cover image
                </h2>
                <p className="mt-1 text-[11px] text-muted">
                  Upload a cover or paste a direct image URL.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Upload from device
                  </p>
                  <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-xs font-medium transition hover:border-primary hover:text-primary">
                    <Upload size={15} aria-hidden="true" />
                    {isUploading ? 'Uploading...' : 'Choose image file'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploading || isSubmitting}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-[10px] text-muted">
                    JPEG, PNG or WebP · Max 500 KB
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="book-image-url"
                    className="text-[10px] font-semibold uppercase tracking-wider text-muted"
                  >
                    Or use an image URL
                  </label>
                  <input
                    id="book-image-url"
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    value={values.image}
                    onChange={(e) => updateField('image', e.target.value)}
                    className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 text-xs outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="text-[10px] text-muted">
                    Paste a direct image link.
                  </p>
                </div>
              </div>

              {isUploading && (
                <div className="mt-3 space-y-1.5" role="status" aria-live="polite">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>Uploading cover image</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <progress
                    className="h-1.5 w-full accent-primary"
                    max={100}
                    value={uploadProgress}
                    aria-label="Cover image upload progress"
                  />
                </div>
              )}

              {values.image && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-background p-2.5">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
                    <Image
                      src={values.image}
                      alt="Selected book cover"
                      fill
                      unoptimized
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Cover selected
                    </p>
                    <p className="truncate text-[10px] text-muted">
                      {values.image}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('image', '')}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:text-status-danger"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-3 border-b border-border pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  03 / The details
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold">
                  About this book
                </h2>
              </div>

              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="book-description" className="text-xs font-medium">
                  Description / Summary <span className="text-status-danger">*</span>
                </label>
                <span className="shrink-0 text-[10px] tabular-nums text-muted">
                  {values.description.length} / 2000
                </span>
              </div>
              <textarea
                id="book-description"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                placeholder="Write a short synopsis or explain what readers can expect..."
                value={values.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-5 outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </section>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-status-danger/20 bg-status-danger/10 px-3 py-2.5 text-xs text-status-danger"
              >
                {formError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/books"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-5 text-xs font-medium transition hover:bg-surface"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Shelving...
                  </>
                ) : (
                  'Add to the shelf'
                )}
              </button>
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Live preview
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold">
                    Your bookplate
                  </h2>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Preview
                </span>
              </div>

              <div className="mx-auto mt-4 max-w-[220px]">
                <div className="relative mx-auto aspect-[2/3] w-[min(100%,190px)] overflow-hidden rounded-r-sm border border-border bg-[#30251f] shadow-[5px_6px_0_#d4c2a8,8px_9px_18px_rgb(48_37_31/0.14)]">
                  {values.image ? (
                    <Image
                      src={values.image}
                      alt="Live book cover preview"
                      fill
                      unoptimized
                      sizes="190px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-between border-l-[5px] border-[#b18a4a]/60 bg-[#30251f] px-4 py-5 text-[#f5eedf]">
                      <span className="text-[8px] uppercase tracking-[0.24em] text-[#d8bd88]">
                        BookNook Collection
                      </span>
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <BookOpen size={27} className="mb-4 text-[#b18a4a]" />
                        <p className="line-clamp-3 font-serif text-lg font-semibold leading-tight">
                          {previewTitle}
                        </p>
                        <span className="mt-3 h-px w-9 bg-[#b18a4a]" />
                        <p className="mt-3 line-clamp-2 text-[10px] text-[#dfd0b8]">
                          {previewAuthor}
                        </p>
                      </div>
                      <span className="text-[8px] uppercase tracking-[0.2em] text-[#d8bd88]">
                        {previewCategory}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Catalog details
                </p>
                <h3 className="mt-2 break-words font-serif text-base font-semibold leading-snug">
                  {previewTitle}
                </h3>
                <p className="mt-1 text-xs text-muted">{previewAuthor}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted">
                    {previewCategory}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted">
                    {values.totalCopies || '0'} copies
                  </span>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-muted">
                  {values.description.trim() || 'Your book description will appear here as you type.'}
                </p>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Added by
                </p>
                <p className="mt-1 truncate text-xs font-medium">
                  {session.user.name || 'BookNook Member'}
                </p>
                <p className="truncate text-[10px] text-muted">
                  {session.user.email}
                </p>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted">
              Preview updates as you fill in the form.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
