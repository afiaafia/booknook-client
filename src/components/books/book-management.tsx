'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LoaderCircle,
  List,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  BOOK_CATEGORIES,
  createBook,
  deleteBook,
  getMyBooks,
  uploadBookImage,
  updateBook,
  type Book,
  type BookCategory,
  type CreateBookRequest,
} from '@/lib/api';
import { useSession } from '@/lib/auth-client';

interface BookFormValues {
  title: string;
  author: string;
  category: BookCategory;
  image: string;
  description: string;
  totalCopies: string;
}

function emptyBookForm(): BookFormValues {
  return {
    title: '',
    author: '',
    category: BOOK_CATEGORIES[0],
    image: '',
    description: '',
    totalCopies: '1',
  };
}

function validateBookForm(values: BookFormValues): {
  input?: CreateBookRequest;
  error?: string;
} {
  const title = values.title.trim();
  const author = values.author.trim();
  const description = values.description.trim();
  const totalCopies = Number(values.totalCopies);

  if (title.length < 2 || title.length > 150) {
    return { error: 'Title must be between 2 and 150 characters.' };
  }
  if (author.length < 2 || author.length > 100) {
    return { error: 'Author must be between 2 and 100 characters.' };
  }
  if (!BOOK_CATEGORIES.includes(values.category)) {
    return { error: 'Choose a valid book category.' };
  }
  try {
    new URL(values.image.trim());
  } catch {
    return { error: 'Enter a valid image URL.' };
  }
  if (description.length < 10 || description.length > 2000) {
    return { error: 'Description must be between 10 and 2000 characters.' };
  }
  if (
    !Number.isInteger(totalCopies) ||
    totalCopies < 1 ||
    totalCopies > 10000
  ) {
    return { error: 'Total copies must be a whole number from 1 to 10000.' };
  }

  return {
    input: {
      title,
      author,
      category: values.category,
      image: values.image.trim(),
      description,
      totalCopies,
    },
  };
}

function BookFormDialog({
  book,
  user,
  isSaving,
  onClose,
  onSave,
}: {
  book: Book | null;
  user: { name: string; email: string };
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: CreateBookRequest) => Promise<void>;
}) {
  const [values, setValues] = useState<BookFormValues>(() =>
    book
      ? {
          title: book.title,
          author: book.author,
          category: book.category,
          image: book.image,
          description: book.description,
          totalCopies: String(book.totalCopies),
        }
      : emptyBookForm()
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function updateField<K extends keyof BookFormValues>(
    field: K,
    value: BookFormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;
    const validation = validateBookForm(values);
    if (!validation.input) {
      setFormError(validation.error || 'Check the book details and try again.');
      return;
    }

    setFormError(null);
    await onSave(validation.input);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving && !isUploading)
          onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-form-title"
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-background shadow-xl sm:rounded-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Book details
            </p>
            <h2 id="book-form-title" className="mt-1 text-xl font-semibold">
              {book ? 'Edit book' : 'Add a book'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isUploading}
            aria-label="Close form"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 px-5 py-6 sm:px-7"
        >
          <div className="rounded-sm border border-border bg-surface px-4 py-3 text-sm">
            <p className="font-medium">Added by</p>
            <p className="mt-1 text-muted">
              {user.name || user.email} · {user.email}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Title
              <input
                required
                minLength={2}
                maxLength={150}
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Author
              <input
                required
                minLength={2}
                maxLength={100}
                value={values.author}
                onChange={(event) => updateField('author', event.target.value)}
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Category
              <select
                value={values.category}
                onChange={(event) =>
                  updateField('category', event.target.value as BookCategory)
                }
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                {BOOK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Total copies
              <input
                required
                type="number"
                min={1}
                max={10000}
                step={1}
                value={values.totalCopies}
                onChange={(event) =>
                  updateField('totalCopies', event.target.value)
                }
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block space-y-2 text-sm font-medium">
              Upload cover image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading || isSaving}
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 text-sm font-normal file:mr-3 file:rounded-sm file:border-0 file:bg-surface-secondary file:px-3 file:py-1.5 file:font-medium file:text-primary"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Or cover image URL
              <input
                type="text"
                inputMode="url"
                required
                value={values.image}
                onChange={(event) => updateField('image', event.target.value)}
                className="block w-full rounded-sm border border-border bg-surface px-3.5 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
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
          </div>

          <label className="block space-y-2 text-sm font-medium">
            Description
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={values.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              className="block w-full resize-y rounded-sm border border-border bg-surface px-3.5 py-3 font-normal leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <span className="block text-right text-xs font-normal text-muted">
              {values.description.length}/2000
            </span>
          </label>

          {formError && (
            <p
              role="alert"
              className="rounded-sm bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="min-h-11 rounded-sm border border-border px-5 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isSaving
                ? book
                  ? 'Saving changes...'
                  : 'Adding book...'
                : book
                  ? 'Save changes'
                  : 'Add book'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ManagementSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="flex items-center gap-4 rounded-sm border border-border bg-surface p-4"
        >
          <div className="h-16 w-12 shrink-0 rounded bg-surface-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-border" />
            <div className="h-3 w-1/3 rounded bg-border" />
          </div>
          <div className="h-9 w-20 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

interface ManagementListState {
  requestKey: string;
  books: Book[];
  error?: string;
}

export default function BookManagement({
  initialCreate = false,
}: {
  initialCreate?: boolean;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [reloadCount, setReloadCount] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(initialCreate);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const saveInFlight = useRef(false);
  const deleteInFlight = useRef(false);
  const sessionUserId = session?.user.id;
  const requestKey = `${sessionUserId ?? ''}:${reloadCount}`;
  const [managementList, setManagementList] =
    useState<ManagementListState | null>(null);

  const [viewMode, setViewMode] = useState<'shelf' | 'ledger'>('ledger');

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      setViewMode('shelf');
    }
  }, []);

  const currentList =
    managementList?.requestKey === requestKey ? managementList : null;
  const books = currentList?.books ?? [];
  const error = currentList?.error ?? null;
  const isLoading = isPending || !session || currentList === null;

  useEffect(() => {
    if (!isPending && !session) router.replace('/sign-in');
  }, [isPending, session, router]);

  useEffect(() => {
    if (isPending || !sessionUserId) return;

    let active = true;

    getMyBooks()
      .then((result) => {
        if (!active) return;
        setManagementList({ requestKey, books: result });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setManagementList({
          requestKey,
          books: [],
          error:
            requestError instanceof Error
              ? requestError.message
              : "We couldn't load the book list.",
        });
      });

    return () => {
      active = false;
    };
  }, [isPending, sessionUserId, reloadCount, requestKey]);

  async function handleSave(input: CreateBookRequest) {
    if (saveInFlight.current) return;

    saveInFlight.current = true;
    setIsSaving(true);
    try {
      if (editingBook) {
        await updateBook(editingBook._id, input);
        toast.success('Book details updated.');
      } else {
        await createBook(input);
        toast.success('Book added to the collection.');
      }

      setIsEditorOpen(false);
      setEditingBook(null);
      if (initialCreate && !editingBook) router.replace('/dashboard/books');
      setReloadCount((count) => count + 1);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "We couldn't save the book. Try again."
      );
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleteInFlight.current) return;

    const target = deleteTarget;
    deleteInFlight.current = true;
    setDeletingId(target._id);
    try {
      await deleteBook(target._id);
      toast.success('Book removed from the collection.');
      setDeleteTarget(null);
      setReloadCount((count) => count + 1);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "We couldn't delete the book. Try again."
      );
    } finally {
      deleteInFlight.current = false;
      setDeletingId(null);
    }
  }

  if (isPending || !session) {
    return (
      <main className="min-h-[calc(100vh-68px)] bg-background px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <ManagementSkeleton />
        </div>
      </main>
    );
  }

  const currentUserId = session.user.id;

  function actionsFor(book: Book) {
    if (book.addedBy.userId !== currentUserId) {
      return (
        <span className="text-xs text-muted">Added by {book.addedBy.name}</span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setEditingBook(book);
            setIsEditorOpen(true);
          }}
          disabled={isSaving || deletingId !== null}
          aria-label={`Edit ${book.title}`}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-sm font-medium transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => setDeleteTarget(book)}
          disabled={isSaving || deletingId !== null}
          aria-label={`Delete ${book.title}`}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-sm font-medium text-status-danger transition hover:border-status-danger hover:bg-status-danger/10 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted transition hover:text-primary"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Dashboard
            </Link>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Personal catalogue
            </p>

            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              My Books
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              A considered collection of titles contributed to the library.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a book
          </button>
        </header>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl">Your collection</h2>
            <p className="mt-1 text-xs text-muted">
              {books.length} {books.length === 1 ? 'title' : 'titles'} in your catalogue
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/books"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:underline"
            >
              Browse library
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() => setViewMode('shelf')}
                aria-pressed={viewMode === 'shelf'}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
                  viewMode === 'shelf'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Shelf
              </button>

              <button
                type="button"
                onClick={() => setViewMode('ledger')}
                aria-pressed={viewMode === 'ledger'}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
                  viewMode === 'ledger'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                Ledger
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7">
          {isLoading ? (
            <ManagementSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
              <h2 className="font-serif text-2xl">The catalogue is unavailable</h2>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={() => setReloadCount((count) => count + 1)}
                className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Try again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
                <BookOpen className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                A shelf waiting to be filled
              </p>

              <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
                You haven’t shelved anything yet.
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                Add your first book to begin building your personal library.
              </p>

              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                  setIsEditorOpen(true);
                }}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add your first book
              </button>
            </div>
          ) : viewMode === 'shelf' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <article
                  key={book._id}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgb(var(--shadow-color)/0.09)]"
                >
                  <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-surface-secondary px-6 py-7">
                    <div className="absolute inset-x-0 bottom-0 h-3 border-t border-border bg-background/70 shadow-[0_-5px_12px_rgb(var(--shadow-color)/0.06)]" />

                    <div className="relative h-52 w-36 overflow-hidden rounded-r-md shadow-[8px_10px_18px_rgb(0_0_0/0.18)] transition duration-300 group-hover:scale-[1.03]">
                      <div className="absolute inset-y-0 left-0 z-10 w-1.5 bg-black/15" />
                      <Image
                        src={book.image}
                        alt={`Cover of ${book.title}`}
                        loading="lazy"
                        fill
                        unoptimized
                        sizes="144px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {book.category}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {book.availableCopies}/{book.totalCopies} available
                      </span>
                    </div>

                    <h3 className="mt-4 line-clamp-2 font-serif text-xl leading-snug">
                      {book.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted">
                      {book.author}
                    </p>

                    <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
                      {actionsFor(book)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="hidden grid-cols-[minmax(0,1fr)_140px_150px_190px] gap-4 border-b border-border bg-surface-secondary/70 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted md:grid">
                <span>Title / Author</span>
                <span>Category</span>
                <span>Last updated</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-border">
                {books.map((book, index) => (
                  <article
                    key={book._id}
                    className="grid gap-4 px-4 py-4 transition hover:bg-background/50 sm:px-5 md:grid-cols-[minmax(0,1fr)_140px_150px_190px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative h-[76px] w-[54px] shrink-0 overflow-hidden rounded-r-sm bg-surface-secondary shadow-sm">
                        <Image
                          src={book.image}
                          alt={`Cover of ${book.title}`}
                          loading="lazy"
                          fill
                          unoptimized
                          sizes="54px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="mb-1 font-mono text-[10px] text-muted">
                          {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="line-clamp-2 font-serif text-lg leading-snug">
                          {book.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-muted">
                          {book.author}
                        </p>
                        <p className="mt-2 text-[11px] text-muted md:hidden">
                          {book.category} · {book.availableCopies}/{book.totalCopies} available
                        </p>
                      </div>
                    </div>

                    <span className="hidden text-xs text-muted md:block">
                      {book.category}
                    </span>

                    <time
                      dateTime={book.updatedAt}
                      className="hidden text-xs text-muted md:block"
                    >
                      {new Date(book.updatedAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>

                    <div className="flex justify-end border-t border-border pt-3 md:border-0 md:pt-0">
                      {actionsFor(book)}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {isEditorOpen && (
        <BookFormDialog
          key={editingBook?._id ?? 'new-book'}
          book={editingBook}
          user={{ name: session.user.name, email: session.user.email }}
          isSaving={isSaving}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingBook(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-5 backdrop-blur-[3px]">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-book-title"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-7"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-danger/10 text-status-danger">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-status-danger">
              Confirm removal
            </p>

            <h2 id="delete-book-title" className="mt-2 font-serif text-2xl">
              Remove this book?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              <span className="font-semibold text-foreground">
                “{deleteTarget.title}”
              </span>{' '}
              will be removed from the collection. This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-surface disabled:opacity-50"
              >
                Keep it
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-status-danger px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {deletingId ? 'Deleting...' : 'Delete book'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
