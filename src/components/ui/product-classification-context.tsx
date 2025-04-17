import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type definitions
export interface Variant {
  id: number;
  name: string;
  selected: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  variants: Variant[];
  classification: ClassificationStep;
  classificationStep: number;
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
  removeProduct: (productId: number) => void;
  updateProductName: (productId: number, name: string) => void;
  updateProductDescription: (productId: number, description: string) => void;
  addVariant: (productId: number, variantName: string) => void;
  removeVariant: (productId: number, variantId: number) => void;
  updateVariantName: (productId: number, variantId: number, name: string) => void;
  toggleVariantSelection: (productId: number, variantId: number) => void;
  selectProduct: (id: number | null) => void;
  toggleProductExpansion: (id: number) => void;
  selectChapter: (productId: number, chapter: { code: string; name: string } | null) => void;
  selectHeading: (productId: number, heading: { code: string; name: string } | null) => void;
  selectSubheading: (productId: number, subheading: { code: string; name: string } | null) => void;
  resetClassification: (productId: number) => void;
  completeClassification: (productId: number) => void;
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
    setProducts([...products, { id: newId, ...product, variants: product.variants || [] }]);
  };

  // Remove a product by ID
  const removeProduct = (productId: number) => {
    setProducts(products.filter(product => product.id !== productId));
  };

  // Update product name
  const updateProductName = (productId: number, name: string) => {
    setProducts(products.map(product =>
      product.id === productId ? { ...product, name } : product
    ));
  };

  // Update product description
  const updateProductDescription = (productId: number, description: string) => {
    setProducts(products.map(product =>
      product.id === productId ? { ...product, description } : product
    ));
  };

  // Add a variant to a product
  const addVariant = (productId: number, variantName: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            variants: [
              ...product.variants,
              {
                id: product.variants.length > 0 ? Math.max(...product.variants.map(v => v.id)) + 1 : 1,
                name: variantName,
                selected: false
              }
            ]
          }
        : product
    ));
  };

  // Remove a variant from a product
  const removeVariant = (productId: number, variantId: number) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            variants: product.variants.filter(variant => variant.id !== variantId)
          }
        : product
    ));
  };

  // Update variant name
  const updateVariantName = (productId: number, variantId: number, name: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            variants: product.variants.map(variant =>
              variant.id === variantId ? { ...variant, name } : variant
            )
          }
        : product
    ));
  };

  // Toggle variant selection
  const toggleVariantSelection = (productId: number, variantId: number) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            variants: product.variants.map(variant =>
              variant.id === variantId ? { ...variant, selected: !variant.selected } : variant
            )
          }
        : product
    ));
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

  // Classification steps (per product)
  const selectChapter = (productId: number, chapter: { code: string; name: string } | null) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            classification: {
              ...product.classification,
              chapter,
              heading: null,
              subheading: null
            }
          }
        : product
    ));
  };

  const selectHeading = (productId: number, heading: { code: string; name: string } | null) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            classification: {
              ...product.classification,
              heading,
              subheading: null
            }
          }
        : product
    ));
  };

  const selectSubheading = (productId: number, subheading: { code: string; name: string } | null) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            classification: {
              ...product.classification,
              subheading
            }
          }
        : product
    ));
  };

  // Reset classification process (per product)
  const resetClassification = (productId: number) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            classification: {
              chapter: null,
              heading: null,
              subheading: null
            }
          }
        : product
    ));
  };

  // Complete classification and update product (per product)
  const completeClassification = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product && product.classification?.chapter && product.classification?.heading && product.classification?.subheading) {
      const hsCode = `${product.classification.chapter.code}.${product.classification.heading.code.slice(2)}.${product.classification.subheading.code.slice(4)}`;
      const hsCodeDescription = `${product.classification.chapter.name} > ${product.classification.heading.name} > ${product.classification.subheading.name}`;
      updateProductHsCode(productId, hsCode, hsCodeDescription);
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
    removeProduct,
    updateProductName,
    updateProductDescription,
    addVariant,
    removeVariant,
    updateVariantName,
    toggleVariantSelection,
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
