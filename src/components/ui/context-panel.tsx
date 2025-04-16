import React from 'react';
import { useProductClassification } from '../context/ProductClassificationContext';
import { Info, HelpCircle, TrendingUp, CheckCircle } from 'lucide-react';

const ContextPanel: React.FC = () => {
  const { products, expandedProductId, classification, classificationStep } = useProductClassification();
  
  // Find the product currently being viewed
  const selectedProduct = Array.isArray(products) ? products.find(p => p.id === expandedProductId) : undefined;
  
  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Classification</h2>
        <p className="text-gray-600 mb-6">
          Accurate HS code classification is essential for determining tariffs, documentation requirements, and market-specific regulations.
        </p>
        
        {/* Market Insight Card */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-blue-800">Market Insight</h3>
              <p className="text-blue-700 text-sm mt-1">
                South African exports that are properly classified typically clear customs 3x faster than those with classification errors.
              </p>
            </div>
          </div>
        </div>
        
        {/* Current Classification Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Classification Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Products Detected</span>
              <span className="text-sm font-medium">{Array.isArray(products) ? products.length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Products Classified</span>
              <span className="text-sm font-medium">{Array.isArray(products) ? products.filter(p => p.hsCode).length : 0} of {Array.isArray(products) ? products.length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Step</span>
              <span className="text-sm font-medium">
                {classificationStep === 0 && "Not Started"}
                {classificationStep === 1 && "Chapter Selection"}
                {classificationStep === 2 && "Heading Selection"}
                {classificationStep === 3 && "Subheading Selection"}
                {classificationStep === 4 && "Complete"}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-purple-600 h-2 rounded-full" 
              style={{ 
                width: `${Array.isArray(products) && products.length > 0 ? (products.filter(p => p.hsCode).length / products.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
        
        {/* Current Product Details */}
        {selectedProduct && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Current Product</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium">{selectedProduct.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p>{selectedProduct.description}</p>
              </div>
              {selectedProduct.hsCode && (
                <div>
                  <span className="text-sm text-gray-500">HS Code</span>
                  <div className="flex items-center">
                    <p className="font-medium">{selectedProduct.hsCode}</p>
                    <CheckCircle size={16} className="ml-2 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedProduct.hsCodeDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Help Information */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-start">
            <div className="bg-gray-200 p-2 rounded-lg">
              <HelpCircle className="text-gray-600" size={20} />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-800">HS Classification Help</h3>
              <div className="text-gray-600 text-sm mt-1 space-y-2">
                <p>HS codes are structured hierarchically:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Chapter (2 digits):</strong> Broad category of goods</li>
                  <li><strong>Heading (4 digits):</strong> More specific group within chapter</li>
                  <li><strong>Subheading (6 digits):</strong> Specific product description</li>
                </ul>
                <p className="mt-2">
                  The first 6 digits are internationally standardized, while additional digits may be country-specific.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Classification Data */}
        {classificationStep > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
            <h3 className="font-medium text-gray-800 mb-3">Current Classification</h3>
            <div className="space-y-3">
              {classification.chapter && (
                <div>
                  <span className="text-xs text-gray-500">Chapter (2-digit)</span>
                  <p className="font-medium">{classification.chapter.code} - {classification.chapter.name}</p>
                </div>
              )}
              {classification.heading && (
                <div>
                  <span className="text-xs text-gray-500">Heading (4-digit)</span>
                  <p className="font-medium">{classification.heading.code} - {classification.heading.name}</p>
                </div>
              )}
              {classification.subheading && (
                <div>
                  <span className="text-xs text-gray-500">Subheading (6-digit)</span>
                  <p className="font-medium">{classification.subheading.code} - {classification.subheading.name}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextPanel;
