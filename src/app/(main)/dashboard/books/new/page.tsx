import type { Metadata } from 'next';
import AddBookForm from '@/components/books/add-book-form';

export const metadata: Metadata = { title: 'Add Book' };

export default function AddBookPage() {
  return <AddBookForm />;
}

