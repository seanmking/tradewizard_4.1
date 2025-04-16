import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import the ProductClassificationPage with dynamic import and disabled SSR
// This ensures the DOM-dependent components only run on the client side
const ProductClassificationPage = dynamic(
  () => import('./main-page'),
  { ssr: false }
);

const ProductClassificationRoute: NextPage = () => {
  return (
    <>
      <Head>
        <title>TradeWizard 3.0 - Product Classification</title>
        <meta name="description" content="Classify your products with the correct HS codes for international trade" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ProductClassificationPage />
    </>
  );
};

export default ProductClassificationRoute;
