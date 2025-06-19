'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    // You can show a loader while checking session status
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Button className="bg-blue-500 hover:bg-blue-400 text-slate-100">Duty Hub</Button>
    </div>
  );
}
