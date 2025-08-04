'use client'; // Required for redirect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard page immediately
    router.replace('/dashboard');
  }, [router]);

  // Optional: Render a loading state or null while redirecting
  return null; // Or a loading indicator component
}
