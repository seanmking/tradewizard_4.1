import React, { useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, Search, Edit } from 'lucide-react';
import { useProductClassification } from '../context/ProductClassificationContext';
import { chapters, headings, subheadings, sampleProducts } from '../data/hs-code-data';

const ProductClassification: React.FC = () => {
  const {
    products,
    selectedProductId,
    expandedProductId,
    classificationStep,
    classification,
    setProducts,
    selectProduct,
    toggleProductExpansion,
    selectChapter,
    selectHeading,
    selectSubheading,
    resetClassification,
    completeClassification,
  } = useProductClassification();

  // Load sample products on initial render
  useEffect(() => {
    if (products.length === 0) {
      setProducts(sampleProducts);
    }
  }, [setProducts, products.length]);

  // Complete classification when step 4 is reached
  useEffect(() => {
    if (classificationStep === 4) {
      completeClassification();
    }
  }, [classificationStep, completeClassification]);

  // Add a new product
  const handleAddProduct = () => {
    const newProduct = { 
      name: 'New Product', 
      description: 'Enter product description here' 
    };
    // In a real app, this would open an edit form
    alert('In a production app, this would open a form to add a new product');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Select Products for Export</h1>
        <p className="text-gray-600 mt-2">We've detected these products from your website. Select the ones you plan to export.</p>
      </div>
      
      {/* Products Grid */}
      <div className="space-y-4 mb-8">
        {products.map(product => (
          <div 
            key={product.id}
            className={`bg-white rounded-2xl shadow-md transition-all duration-300 ease-in-out overflow-hidden
              ${expandedProductId === product.id ? 'border-2 border-purple-600 bg-purple-50' : 'border border-gray-200'}`}
          >
            {/* Product Card Header */}
            <div 
              className="p-6 flex items-center cursor-pointer"
              onClick={() => toggleProductExpansion(product.id)}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    checked={selectedProductId === product.id || Boolean(product.hsCode)}
                    onChange={() => selectProduct(product.id)}
                  />
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{product.name}</h3>
                  
                  {product.hsCode && (
                    <div className="ml-3 px-3 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      HS Code: {product.hsCode}
                    </div>
                  )}
                </div>
                <p className="mt-1 ml-8 text-sm text-gray-500">{product.description}</p>
              </div>
              
              {expandedProductId === product.id ? (
                <ChevronDown className="text-gray-400" size={24} />
              ) : (
                <ChevronRight className="text-gray-400" size={24} />
              )}
            </div>
            
            {/* Expanded Classification UI */}
            {expandedProductId === product.id && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="mt-4">
                  {classificationStep < 4 ? (
                    <>
                      <div className="flex items-center mb-4">
                        <div className="text-sm font-medium text-gray-500 flex items-center">
                          What is an HS Code? <HelpCircle size={16} className="ml-1 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-6">
                        <div className={`h-2 w-12 rounded-full ${classificationStep >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                        <div className="h-px w-8 bg-gray-200"></div>
                        <div className={`h-2 w-12 rounded-full ${classificationStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                        <div className="h-px w-8 bg-gray-200"></div>
                        <div className={`h-2 w-12 rounded-full ${classificationStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                      </div>
                      
                      {/* Step 1: Chapter Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Step 1: Select Chapter (2-digit)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                          </div>
                          <select 
                            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                            value={classification.chapter?.code || ''}
                            onChange={(e) => {
                              const chapter = chapters.find(c => c.code === e.target.value);
                              selectChapter(chapter || null);
                            }}
                          >
                            <option value="">Select a chapter...</option>
                            {chapters.map(chapter => (
                              <option key={chapter.code} value={chapter.code}>
                                {chapter.code} - {chapter.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Step 2: Heading Selection */}
                      {classificationStep >= 1 && classification.chapter && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Step 2: Select Heading (4-digit)
                          </label>
                          <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            value={classification.heading?.code || ''}
                            onChange={(e) => {
                              const heading = headings[classification.chapter?.code || '']?.find(h => h.code === e.target.value);
                              selectHeading(heading || null);
                            }}
                          >
                            <option value="">Select a heading...</option>
                            {classification.chapter && headings[classification.chapter.code]?.map(heading => (
                              <option key={heading.code} value={heading.code}>
                                {heading.code} - {heading.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Step 3: Subheading Selection */}
                      {classificationStep >= 2 && classification.heading && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Step 3: Select Subheading (6-digit)
                          </label>
                          <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            value={classification.subheading?.code || ''}
                            onChange={(e) => {
                              const subheading = subheadings[classification.heading?.code || '']?.find(s => s.code === e.target.value);
                              selectSubheading(subheading || null);
                            }}
                          >
                            <option value="">Select a subheading...</option>
                            {classification.heading && subheadings[classification.heading.code]?.map(subheading => (
                              <option key={subheading.code} value={subheading.code}>
                                {subheading.code} - {subheading.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 italic mb-4">
                        Not sure where to start? Just pick what feels closest — you can change it later.
                      </div>
                    </>
                  ) : (
                    // Success State
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Classification Complete!</h3>
                      <p className="text-gray-600 mb-4">
                        You've classified {product.name} as:
                      </p>
                      <div className="inline-block bg-gray-100 rounded-lg px-4 py-3 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                            {classification.chapter?.code}
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                          <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                            {classification.heading?.code.slice(2)}
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                          <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                            {classification.subheading?.code.slice(4)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {classification.chapter?.name} &gt; {classification.heading?.name} &gt; {classification.subheading?.name}
                        </div>
                      </div>
                      <button 
                        className="text-purple-600 font-medium flex items-center justify-center mx-auto"
                        onClick={resetClassification}
                      >
                        <Edit size={16} className="mr-1" /> Change classification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add Product Button */}
        <button 
          onClick={handleAddProduct}
          className="w-full flex items-center justify-center py-4 px-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all"
        >
          <Plus size={20} className="mr-2" />
          Add another product
        </button>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button className="flex items-center px-4 py-2 text-gray-600 font-medium">
          <ArrowLeft size={18} className="mr-2" />
          Back
        </button>
        
        <button className="flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          Continue
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ProductClassification;