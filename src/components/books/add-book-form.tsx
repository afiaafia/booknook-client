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
      toast.success(`���${title}��� has been added to the library collection.`);
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
      <main className="min-h-[calc(100vh-68px)] bg-background px-5 py-12">
        <div className="mx-auto max-w-3xl animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-border" />
          <div className="h-10 w-64 rounded bg-border" />
          <div className="h-96 rounded-sm bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-9 sm:px-8 sm:py-12">
        <Link
          href="/dashboard/books"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to My Books
        </Link>

        <div className="mt-6 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Library Catalog
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Add a New Book
          </h1>
          <p className="mt-2 text-sm text-muted">
            Contribute a title to the BookNook community collection. It will
            become immediately discoverable and borrowable by all members.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          {/* Owner details card */}
          <div className="rounded-sm border border-border bg-surface p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Book Owner / Added By
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-primary">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {session.user.name || 'BookNook Member'}
                </p>
                <p className="truncate text-xs text-muted">
                  {session.user.email} �� Logged in account
                </p>
              </div>
            </div>
          </div>

          {/* Title and Author */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="book-title" className="block text-sm font-medium">
                Book Title <span className="text-status-danger">*</span>
              </label>
              <input
                id="book-title"
                type="text"
                required
                minLength={2}
                maxLength={150}
                placeholder="e.g., The Midnight Library"
                value={values.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="book-author"
                className="block text-sm font-medium"
              >
                Author Name <span className="text-status-danger">*</span>
              </label>
              <input
                id="book-author"
                type="text"
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g., Matt Haig"
                value={values.author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          {/* Category and Total Copies */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="book-category"
                className="block text-sm font-medium"
              >
                Category <span className="text-status-danger">*</span>
              </label>
              <select
                id="book-category"
                value={values.category}
                onChange={(e) =>
                  updateField('category', e.target.value as BookCategory)
                }
                className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="book-copies"
                className="block text-sm font-medium"
              >
                Total Copies <span className="text-status-danger">*</span>
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
                className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="text-xs text-muted">
                Initial available copies will equal the total copies.
              </p>
            </div>
          </div>

          {/* Cover image options */}
          <div className="space-y-4 rounded-sm border border-border bg-surface p-5">
            <div>
              <label className="block text-sm font-medium">
                Cover Image <span className="text-status-danger">*</span>
              </label>
              <p className="mt-1 text-xs text-muted">
                Upload a cover photo from your device or provide a direct web
                image URL.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Option A: Upload File
                </label>
                <div className="mt-2">
                  <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background px-4 py-3 text-sm font-medium text-primary transition hover:border-primary">
                    <Upload size={16} />
                    <span>Choose image file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading || isSubmitting}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-muted">
                    Max size: 500 KB (JPEG, PNG, WebP)
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="book-image-url"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Option B: Image URL
                </label>
                <div className="mt-2">
                  <input
                    id="book-image-url"
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    value={values.image}
                    onChange={(e) => updateField('image', e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Paste an HTTPS image link.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            {values.image && (
              <div className="flex items-center gap-4 rounded-sm border border-border bg-background p-3">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-surface-secondary">
                  <Image
                    src={values.image}
                    alt="Cover preview"
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Cover Preview
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {values.image}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('image', '')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted transition hover:text-status-danger"
                  aria-label="Remove image"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex justify-between text-xs text-muted">
                <span>Uploading cover image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <progress
                className="h-2 w-full accent-primary"
                max={100}
                value={uploadProgress}
                aria-label="Cover image upload progress"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="book-description"
                className="block text-sm font-medium"
              >
                Description / Summary <span className="text-status-danger">*</span>
              </label>
              <span className="text-xs text-muted">
                {values.description.length} / 2000
              </span>
            </div>
            <textarea
              id="book-description"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Provide a synopsis of the book, topics covered, or why readers would love it..."
              value={values.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full resize-y rounded-sm border border-border bg-surface px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-sm bg-status-danger/10 p-4 text-sm text-status-danger"
            >
              {formError}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/books"
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-5 text-sm font-medium transition hover:bg-surface"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Adding Book...
                </>
              ) : (
                'Add Book'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
