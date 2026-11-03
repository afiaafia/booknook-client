import { authClient } from '@/lib/auth-client';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const BOOK_CATEGORIES = [
  'Fiction',
  'Science',
  'History',
  'Kids',
  'Others',
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export type BookSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface Book {
  _id: string;
  title: string;
  author: string;
  category: BookCategory;
  image: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  addedBy: {
    userId: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Borrow {
  _id: string;
  bookId: string;
  bookTitle: string;
  bookImage: string;
  userId: string;
  userEmail: string;
  borrowDate: string;
  returnDate: string;
  returnedAt: string | null;
  status: 'active' | 'returned';
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    stack?: string;
  };
}

export interface GetBooksParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: BookCategory;
  sort?: BookSort;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  category: BookCategory;
  image: string;
  description: string;
  totalCopies: number;
}

export type UpdateBookRequest = Partial<CreateBookRequest>;

export interface BorrowBookRequest {
  bookId: string;
  returnDate: string | Date;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
  authenticated?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorDetails(value: unknown): {
  message?: string;
  code?: string;
} {
  if (!isRecord(value)) return {};

  const error = isRecord(value.error) ? value.error : undefined;

  return {
    message: typeof value.message === 'string' ? value.message : undefined,
    code: error && typeof error.code === 'string' ? error.code : undefined,
  };
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, authenticated = false }: ApiRequestOptions = {}
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (authenticated) {
    const tokenResponse = await authClient.$fetch('/token', {
      method: 'GET',
      throw: true,
    });
    if (!isRecord(tokenResponse) || typeof tokenResponse.token !== 'string') {
      throw new ApiError('Could not obtain an access token.', 401);
    }
    headers.set('Authorization', `Bearer ${tokenResponse.token}`);
  }
  const requestBody = body === undefined ? undefined : JSON.stringify(body);

  if (requestBody !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  const responseText = await response.text();
  let payload: unknown;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      payload = undefined;
    }
  }

  const errorDetails = readErrorDetails(payload);

  if (!response.ok) {
    throw new ApiError(
      errorDetails.message ||
        response.statusText ||
        `API request failed with status ${response.status}`,
      response.status,
      errorDetails.code
    );
  }

  if (!isRecord(payload)) {
    throw new ApiError(
      responseText
        ? `The API returned a non-JSON response (status ${response.status}).`
        : `The API returned an empty response (status ${response.status}).`,
      response.status
    );
  }

  if (payload.success !== true) {
    throw new ApiError(
      errorDetails.message || 'The API returned an unsuccessful response.',
      response.status,
      errorDetails.code
    );
  }

  return payload.data as T;
}

export async function getBooks(
  params: GetBooksParams = {}
): Promise<{ books: Book[]; pagination: Pagination }> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }

  const queryString = query.toString();
  return apiRequest(`/api/books${queryString ? `?${queryString}` : ''}`);
}

export function getLatestBooks(): Promise<Book[]> {
  return apiRequest('/api/books/latest');
}

export function getMyBooks(): Promise<Book[]> {
  return apiRequest('/api/books/me', { authenticated: true });
}

export function getBook(id: string): Promise<Book> {
  return apiRequest(`/api/books/${encodeURIComponent(id)}`);
}

export function createBook(
  input: CreateBookRequest
): Promise<{ bookId: string }> {
  return apiRequest('/api/books', {
    method: 'POST',
    body: input,
    authenticated: true,
  });
}

export function updateBook(
  id: string,
  input: UpdateBookRequest
): Promise<Book> {
  return apiRequest(`/api/books/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
    authenticated: true,
  });
}

export function deleteBook(id: string): Promise<void> {
  return apiRequest(`/api/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export function getMyBorrows(): Promise<Borrow[]> {
  return apiRequest('/api/borrows', { authenticated: true });
}

export function borrowBook(
  input: BorrowBookRequest
): Promise<{ borrowId: string }> {
  return apiRequest('/api/borrows', {
    method: 'POST',
    body: input,
    authenticated: true,
  });
}

export function returnBorrow(id: string): Promise<Borrow> {
  return apiRequest(`/api/borrows/${encodeURIComponent(id)}/return`, {
    method: 'PATCH',
    authenticated: true,
  });
}

export function uploadBookImage(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Choose a JPEG, PNG, or WebP image.'));
  }
  if (file.size === 0 || file.size > 500_000) {
    return Promise.reject(
      new Error('Choose an image between 1 byte and 500 KB.')
    );
  }

  return authClient
    .$fetch('/token', { method: 'GET', throw: true })
    .then((tokenResponse) => {
      if (!isRecord(tokenResponse) || typeof tokenResponse.token !== 'string') {
        throw new ApiError('Could not obtain an access token.', 401);
      }

      return new Promise<string>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${API_BASE_URL}/api/uploads/image`);
        request.withCredentials = true;
        request.setRequestHeader(
          'Authorization',
          `Bearer ${tokenResponse.token}`
        );
        request.setRequestHeader('Content-Type', file.type);
        request.setRequestHeader('Accept', 'application/json');
        request.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        request.addEventListener('load', () => {
          let payload: unknown;
          try {
            payload = JSON.parse(request.responseText) as unknown;
          } catch {
            reject(
              new ApiError(
                'The upload service returned an invalid response.',
                request.status
              )
            );
            return;
          }
          if (request.status < 200 || request.status >= 300) {
            const details = readErrorDetails(payload);
            reject(
              new ApiError(
                details.message || 'Image upload failed.',
                request.status,
                details.code
              )
            );
            return;
          }
          if (
            !isRecord(payload) ||
            payload.success !== true ||
            !isRecord(payload.data) ||
            typeof payload.data.imageUrl !== 'string'
          ) {
            reject(
              new ApiError(
                'The upload service returned an invalid response.',
                request.status
              )
            );
            return;
          }
          onProgress(100);
          resolve(payload.data.imageUrl);
        });
        request.addEventListener('error', () =>
          reject(new ApiError('Image upload failed. Check your connection.', 0))
        );
        request.addEventListener('abort', () =>
          reject(new ApiError('Image upload was cancelled.', 0))
        );
        request.send(file);
      });
    });
}
