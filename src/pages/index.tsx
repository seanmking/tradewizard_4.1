import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/website-analysis');
  }, [router]);
  return null;
}
