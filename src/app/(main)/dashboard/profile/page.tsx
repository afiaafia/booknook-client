import type { Metadata } from 'next';

import ProfilePage from '@/components/auth/profile-page';

export const metadata: Metadata = { title: 'My Reading Corner' };

export default function MyProfilePage() {
  return <ProfilePage />;
}
