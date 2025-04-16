import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type definitions
export interface Product {
  id: number;
  name: string;
  description: string;
  hsCode?: string;
  hsCodeDescription?: string;
}

export interface ClassificationStep {
  chapter: { code: string; name: string } | null;
  heading: { code: string; name: string } | null;
  subheading: { code: string; name: string } | null;
}

export interface ProductClassificationContextType {
  products: Product[];
  selectedProductId: number | null;
  expandedProductId: number | null;
  classificationStep: number;
  classification: ClassificationStep;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  selectProduct: (id: number | null) => void;
  toggleProductExpansion: (id: number) => void;
  selectChapter: (chapter: { code: string; name: string } | null) => void;
  selectHeading: (heading: { code: string; name: string } | null) => void;
  selectSubheading: (subheading: { code: string; name: string } | null) => void;
  resetClassification: () => void;
  completeClassification: () => void;
}

const ProductClassificationContext = createContext<ProductClassificationContextType | undefined>(undefined);

export const ProductClassificationProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [classificationStep, setClassificationStep] = useState<number>(0);
  const [classification, setClassification] = useState<ClassificationStep>({
    chapter: null,
    heading: null,
    subheading: null,
  });

  // Actions
  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now() }]);
  };

  const selectProduct = (id: number | null) => {
    setSelectedProductId(id);
    setExpandedProductId(id);
    setClassificationStep(1);
    setClassification({ chapter: null, heading: null, subheading: null });
  };

  const toggleProductExpansion = (id: number) => {
    setExpandedProductId(prev => (prev === id ? null : id));
  };

  const selectChapter = (chapter: { code: string; name: string } | null) => {
    setClassification(prev => ({ ...prev, chapter, heading: null, subheading: null }));
    setClassificationStep(2);
  };

  const selectHeading = (heading: { code: string; name: string } | null) => {
    setClassification(prev => ({ ...prev, heading, subheading: null }));
    setClassificationStep(3);
  };

  const selectSubheading = (subheading: { code: string; name: string } | null) => {
    setClassification(prev => ({ ...prev, subheading }));
    setClassificationStep(4);
  };

  const resetClassification = () => {
    setClassification({ chapter: null, heading: null, subheading: null });
    setClassificationStep(1);
  };

  const completeClassification = () => {
    setClassificationStep(4);
  };

  return (
    <ProductClassificationContext.Provider
      value={{
        products,
        selectedProductId,
        expandedProductId,
        classificationStep,
        classification,
        setProducts,
        addProduct,
        selectProduct,
        toggleProductExpansion,
        selectChapter,
        selectHeading,
        selectSubheading,
        resetClassification,
        completeClassification,
      }}
    >
      {children}
    </ProductClassificationContext.Provider>
  );
};

export function useProductClassification() {
  const context = useContext(ProductClassificationContext);
  if (!context) {
    throw new Error('useProductClassification must be used within a ProductClassificationProvider');
  }
  return context;
}
