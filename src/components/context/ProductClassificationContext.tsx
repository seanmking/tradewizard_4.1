import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sampleProducts } from '../data/hs-code-data';

// Type definitions
export interface ProductVariant {
  id: number;
  name: string;
  selected: boolean;
  sku?: string;
  price?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  hsCode?: string;
  tariffCode?: string;
  countryOfOrigin?: string;
  exportControlCode?: string;
  unitOfQuantity?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  images?: string[];
  category?: string;
  brand?: string;
  variants: ProductVariant[];
  classification: {
    chapter: { code: string; name: string } | null;
    heading: { code: string; name: string } | null;
    subheading: { code: string; name: string } | null;
  };
  classificationStep: number;
  hsCode?: string;
  tariffCode?: string;
  countryOfOrigin?: string;
  exportControlCode?: string;
  unitOfQuantity?: string;
  declaredValue?: number;
  ftaEligibility?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassificationStep {
  chapter: { code: string; name: string } | null;
  heading: { code: string; name: string } | null;
  subheading: { code: string; name: string } | null;
}

export interface ProductClassificationContextType {
  updateProductName: (productId: number, newName: string) => void;
  toggleVariantSelection: (productId: number, variantId: number) => void;
  products: Product[];
  selectedProductId: number | null;
  expandedProductId: number | null;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  selectProduct: (id: number | null) => void;
  toggleProductExpansion: (id: number) => void;
  selectChapter: (productId: number, chapter: { code: string; name: string } | null) => void;
  selectHeading: (productId: number, heading: { code: string; name: string } | null) => void;
  selectSubheading: (productId: number, subheading: { code: string; name: string } | null) => void;
  resetClassification: (productId: number) => void;
  completeClassification: (productId: number) => void;
}

const ProductClassificationContext = createContext<ProductClassificationContextType | undefined>(undefined);

export const ProductClassificationProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  // DEV/DEMO ONLY: Auto-load sample products if none exist, so UI can be reviewed
  // DEMO/DEV ONLY: Always reload sample products if products are empty (ensures fallback works after navigation/reset)
  useEffect(() => {
    if (products.length === 0) {
      setProducts(
        sampleProducts.map((p: any, idx: number) => ({
          ...p,
          variants: [
            { id: 1, name: `${p.name} Variant A`, selected: false },
            { id: 2, name: `${p.name} Variant B`, selected: false }
          ],
          classification: { chapter: null, heading: null, subheading: null },
          classificationStep: 1,
        }))
      );
    }
    // This fallback will always run when products are cleared/reset (for demo/dev purposes only)
  }, [products.length]); // Remove for production

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  // Actions
  const updateProductName = (productId: number, newName: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, name: newName } : p));
  };

  const toggleVariantSelection = (productId: number, variantId: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, variants: p.variants.map(v => v.id === variantId ? { ...v, selected: !v.selected } : v) }
        : p
    ));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now() }]);
  };

  const selectProduct = (id: number | null) => {
    setSelectedProductId(id);
    setExpandedProductId(id);
  };

  const toggleProductExpansion = (id: number) => {
    setExpandedProductId(prev => (prev === id ? null : id));
  };

  const selectChapter = (productId: number, chapter: { code: string; name: string } | null) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? {
            ...p,
            classification: { chapter, heading: null, subheading: null },
            classificationStep: 2,
          }
        : p
    ));
  };

  const selectHeading = (productId: number, heading: { code: string; name: string } | null) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? {
            ...p,
            classification: { ...p.classification, heading, subheading: null },
            classificationStep: 3,
          }
        : p
    ));
  };

  const selectSubheading = (productId: number, subheading: { code: string; name: string } | null) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? {
            ...p,
            classification: { ...p.classification, subheading },
            classificationStep: 4,
          }
        : p
    ));
  };

  const resetClassification = (productId: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? {
            ...p,
            classification: { chapter: null, heading: null, subheading: null },
            classificationStep: 1,
          }
        : p
    ));
  };

  const completeClassification = (productId: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, classificationStep: 4 }
        : p
    ));
  };


  return (
    <ProductClassificationContext.Provider
      value={{
        products,
        selectedProductId,
        expandedProductId,
        setProducts,
        addProduct,
        selectProduct,
        toggleProductExpansion,
        selectChapter,
        selectHeading,
        selectSubheading,
        resetClassification,
        completeClassification,
        updateProductName,
        toggleVariantSelection,
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
