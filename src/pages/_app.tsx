import React from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AppProvider } from '../contexts/AppContext';
import { ScrapingProvider } from '../context/ScrapingContext';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

function MyApp({ Component, pageProps }: AppProps) {
  const assessmentId = 'assessment_123'; // Placeholder

  if (!assessmentId || !supabaseClient) {
    console.error("Missing assessmentId or supabaseClient in _app.tsx");
    return (
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <ScrapingProvider assessmentId={assessmentId} supabaseClient={supabaseClient}>
        <Component {...pageProps} />
      </ScrapingProvider>
    </AppProvider>
  );
}

export default MyApp;
