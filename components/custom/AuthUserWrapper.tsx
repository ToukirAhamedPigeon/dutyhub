'use client';

import { useSession } from 'next-auth/react';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function AuthUserWrapper() {
  const { data: session } = useSession();
  useAuthUser(session);
  return null;
}
