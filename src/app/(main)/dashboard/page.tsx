import type { Metadata } from 'next';

import BorrowingDashboard from '@/components/borrows/borrowing-dashboard';

export const metadata: Metadata = { title: 'My Borrows' };

export default function DashboardPage() {
  return <BorrowingDashboard />;
}
