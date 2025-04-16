import React from 'react';
import Head from 'next/head';
import MainPage from '../components/ui/main-page';

export default function Home() {
  return (
    <>
      <Head>
        <title>TradeWizard 4.1</title>
      </Head>
      <MainPage />
    </>
  );
}
