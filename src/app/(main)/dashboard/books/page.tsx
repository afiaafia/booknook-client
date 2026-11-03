import type { Metadata } from 'next';

import BookManagement from '@/components/books/book-management';

export const metadata: Metadata = { title: 'My Books' };

export default function BookManagementPage() {
  return <BookManagement />;
}
