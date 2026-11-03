import type { Metadata } from 'next';
import HomeReadingRoom from '@/components/books/home-reading-room';

export const metadata: Metadata = {
  title: 'The Reading Room',
};

export default function Home() {
  return (
    <main className="flex-1 text-foreground">
      <HomeReadingRoom />
    </main>
  );
}
