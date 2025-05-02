import React from 'react';
import { Product } from '../../../context/AssessmentContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <div className="p-4 bg-white border rounded shadow mt-4 flex justify-between items-center">
    <div>
      <p className="font-semibold">{product.name}</p>
      <p className="text-sm text-gray-600">Category: {product.category || 'N/A'}</p>
      <p className="text-sm text-gray-600">HS Code: {product.estimated_hs_code || 'N/A'}</p>
    </div>
    <div>
      {/* TODO: confidence badge & edit/delete buttons */}
    </div>
  </div>
);

// Helper for unique key fallback (if needed elsewhere)
export function getProductKey(product: Product): string {
  return product.id || `${product.name}-${product.category || ''}`;
}


export default ProductCard;
