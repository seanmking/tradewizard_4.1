import React from 'react';
import ThreePanelLayout from '../components/ui/ThreePanelLayout';
import WebsiteAnalysisLeftNavPanel from '../components/ui/WebsiteAnalysisLeftNavPanel';
import ProductClassification from '../components/ui/product-classification-component';
import WebsiteAnalysisRightContextPanel from '../components/ui/WebsiteAnalysisRightContextPanel';
import { ProductClassificationProvider } from '../components/context/ProductClassificationContext';

const ProductClassificationPage: React.FC = () => (
  <ProductClassificationProvider>
    <ThreePanelLayout
      left={<WebsiteAnalysisLeftNavPanel />}
      center={<ProductClassification />}
      right={<WebsiteAnalysisRightContextPanel />}
    />
  </ProductClassificationProvider>
);

export default ProductClassificationPage;
