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
  // Product management
  products: Product[];
  selectedProductId: number | null;
  expandedProductId: number | null;
  classificationStep: number; // 0: not started, 1: chapter, 2: heading, 3: subheading, 4: complete
  classification: ClassificationStep;
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  selectProduct: (id: number | null) => void;
  toggleProductExpansion: (id: number) => void;
  selectChapter: (chapter: { code: string; name: string } | null) => void;
  selectHeading: (heading: { code: string; name: string } | null) => void;
  selectSubheading: (subheading: { code: string; name: string } | null) => void;
  resetClassification: () => void;
  completeClassification: () => void;
  updateProductHsCode: (productId: number, hsCode: string, description: string) => void;
}

// Create context with default values
const ProductClassificationContext = createContext<ProductClassificationContextType | undefined>(undefined);

// Provider component
export const ProductClassificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [classificationStep, setClassificationStep] = useState<number>(0);
  const [classification, setClassification] = useState<ClassificationStep>({
    chapter: null,
    heading: null,
    subheading: null
  });

  // Function to add a new product with automatic ID
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newId = products.length > 0 
      ? Math.max(...products.map(p => p.id)) + 1 
      : 1;
    
    setProducts([...products, { id: newId, ...product }]);
  };

  // Toggle product expansion for UI
  const toggleProductExpansion = (id: number) => {
    if (expandedProductId === id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(id);
      setSelectedProductId(id);
      setClassificationStep(0);
      setClassification({
        chapter: null,
        heading: null,
        subheading: null
      });
    }
  };

  // Select a product for classification
  const selectProduct = (id: number | null) => {
    setSelectedProductId(id);
  };

  // Classification steps
  const selectChapter = (chapter: { code: string; name: string } | null) => {
    setClassification({ ...classification, chapter, heading: null, subheading: null });
    setClassificationStep(1);
  };

  const selectHeading = (heading: { code: string; name: string } | null) => {
    setClassification({ ...classification, heading, subheading: null });
    setClassificationStep(2);
  };

  const selectSubheading = (subheading: { code: string; name: string } | null) => {
    setClassification({ ...classification, subheading });
    setClassificationStep(3);
    
    // Auto-advance to completion after slight delay
    setTimeout(() => {
      setClassificationStep(4);
    }, 800);
  };

  // Reset classification process
  const resetClassification = () => {
    setClassificationStep(0);
    setClassification({
      chapter: null,
      heading: null,
      subheading: null
    });
  };

  // Complete classification and update product
  const completeClassification = () => {
    if (selectedProductId && classification.chapter && classification.heading && classification.subheading) {
      const hsCode = `${classification.chapter.code}.${classification.heading.code.slice(2)}.${classification.subheading.code.slice(4)}`;
      const hsCodeDescription = `${classification.chapter.name} > ${classification.heading.name} > ${classification.subheading.name}`;
      
      updateProductHsCode(selectedProductId, hsCode, hsCodeDescription);
    }
  };

  // Update product with HS code
  const updateProductHsCode = (productId: number, hsCode: string, description: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, hsCode, hsCodeDescription: description } 
        : product
    ));
  };

  const value = {
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
    updateProductHsCode
  };

  return (
    <ProductClassificationContext.Provider value={value}>
      {children}
    </ProductClassificationContext.Provider>
  );
};

// Custom hook for using the context
export const useProductClassification = () => {
  const context = useContext(ProductClassificationContext);
  if (context === undefined) {
    throw new Error('useProductClassification must be used within a ProductClassificationProvider');
  }
  return context;
};
