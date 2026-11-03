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
              {user.name || user.email} �� {user.email}
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
      <section className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Collection tools
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Book management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Add titles to the collection. You can edit or remove books added
              by your account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Book
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted">
          <p>
            {books.length} {books.length === 1 ? 'book' : 'books'} added by you
          </p>
          <Link
            href="/books"
            className="font-medium text-primary hover:underline"
          >
            Browse collection
          </Link>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <ManagementSkeleton />
          ) : error ? (
            <div className="rounded-sm border border-border bg-surface px-6 py-12 text-center">
              <h2 className="font-semibold">Book list unavailable</h2>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={() => setReloadCount((count) => count + 1)}
                className="mt-5 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Try again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-surface px-6 py-14 text-center">
              <BookOpen
                className="mx-auto h-10 w-10 text-primary"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-lg font-semibold">
                No books in the collection yet
              </h2>
              <p className="mt-2 text-sm text-muted">
                Add the first title to make it available for readers.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                  setIsEditorOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Book
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-sm border border-border bg-surface md:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f3f5f1] text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Book
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Copies
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-semibold"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {books.map((book) => (
                      <tr key={book._id}>
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-secondary">
                              <Image
                                src={book.image}
                                alt={`Cover of ${book.title}`}
                                loading="lazy"
                                fill
                                unoptimized
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {book.title}
                              </p>
                              <p className="mt-1 truncate text-sm text-muted">
                                {book.author}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">{book.category}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className="font-semibold">
                            {book.availableCopies}
                          </span>
                          <span className="text-muted">
                            {' '}
                            / {book.totalCopies}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            {actionsFor(book)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {books.map((book) => (
                  <article
                    key={book._id}
                    className="rounded-sm border border-border bg-surface p-4"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-surface-secondary">
                        <Image
                          src={book.image}
                          alt={`Cover of ${book.title}`}
                          loading="lazy"
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 font-semibold leading-5">
                          {book.title}
                        </h2>
                        <p className="mt-1 truncate text-sm text-muted">
                          {book.author}
                        </p>
                        <p className="mt-2 text-xs font-medium text-primary">
                          {book.category}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {book.availableCopies} of {book.totalCopies} copies
                          available
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end border-t border-border pt-3">
                      {actionsFor(book)}
                    </div>
                  </article>
                ))}
              </div>
            </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-5">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-book-title"
            className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-xl"
          >
            <h2 id="delete-book-title" className="text-xl font-semibold">
              Remove this book?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              ���{deleteTarget.title}��� will be removed from the collection. This
              action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="min-h-10 rounded-sm border border-border px-4 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-status-danger px-4 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {deletingId ? 'Removing...' : 'Remove book'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
