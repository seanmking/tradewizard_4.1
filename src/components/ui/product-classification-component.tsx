import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronDown, Plus, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, Search, Edit } from 'lucide-react';
import { useProductClassification } from './product-classification-context';
import { chapters, headings, subheadings, sampleProducts } from '../data/hs-code-data';

const ProductClassification: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [activeStep, setActiveStep] = React.useState<'grouping' | 'classification' | 'compliance'>('grouping');
  const [activeProductId, setActiveProductId] = React.useState<number | null>(null);

  const {
    products,
    selectedProductId,
    expandedProductId,
    selectProduct,
    toggleProductExpansion,
    selectChapter,
    selectHeading,
    selectSubheading,
    resetClassification,
    completeClassification,
    updateProductName,
    updateProductDescription,
    removeProduct,
    addVariant,
    removeVariant,
    updateVariantName,
    toggleVariantSelection,
    addProduct, // Ensure this is in context
  } = useProductClassification();

  const router = useRouter();

  // Remove legacy useEffect and addProduct logic. Only use context-driven UI.


  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Select Products for Export</h1>
        <p className="text-gray-600 mt-2">We&apos;ve detected these products from your website. Select the ones you plan to export. You can edit product and variant names, or remove items as needed.</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
<p className="mt-2 text-sm text-gray-500">Tip: You must select at least one variant for any product you wish to export. Use the checkboxes above to select variants.</p>
        </div>
      )}
      {products.length === 0 && (
        <div className="text-center text-gray-500 p-8 border rounded-xl bg-gray-50">
          No products detected. Please add a product to begin classification. If you believe products should have been detected, try refreshing the page or adding them manually below.
          <button
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={() => addProduct({
  name: 'New Product',
  description: '',
  variants: [{ id: 1, name: 'Default Variant', selected: false }],
  classification: { chapter: null, heading: null, subheading: null },
  classificationStep: 0
})}
          >
            Add Product
          </button>
        </div>
      )}
      {/* Products Grid */}
      <div className="space-y-4 mb-8">
        {products.map(product => (
          <div
            key={product.id}
            className={`bg-white rounded-2xl shadow-md transition-all duration-300 ease-in-out overflow-hidden ${activeProductId === product.id ? 'border-2 border-purple-600 bg-purple-50' : 'border border-gray-200'}`}
          >
            {activeProductId !== product.id ? (
              <div className="p-6">
                <input
                  className="font-bold text-lg mb-2 border-b border-gray-300 focus:border-purple-500 outline-none w-full bg-transparent"
                  value={product.name}
                  onChange={e => updateProductName(product.id, e.target.value)}
                />
                <div className="mt-2">
                  {product.variants.map(variant => (
                    <label key={variant.id} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={variant.selected}
                        onChange={() => toggleVariantSelection(product.id, variant.id)}
                      />
                      <span>{variant.name}</span>
                      <button
                        className="text-purple-600 font-medium flex items-center justify-center"
                        onClick={() => {
  const newName = prompt('Enter new variant name:', variant.name);
  if (newName) updateVariantName(product.id, variant.id, newName);
}}
                      >
                        <Edit size={16} className="mr-1" /> Edit
                      </button>
                      <button
                        className="text-red-600 font-medium flex items-center justify-center"
                        onClick={() => {
  if (window.confirm(`Remove variant "${variant.name}" from product "${product.name}"?`)) {
    removeVariant(product.id, variant.id);
  }
}}
                      >
                        <HelpCircle size={16} className="mr-1" /> Remove
                      </button>
                    </label>
                  ))}
                  <button
                    className="text-purple-600 font-medium flex items-center justify-center"
                    onClick={() => addVariant(product.id, 'New Variant')}
                  >
                    <Plus size={16} className="mr-1" /> Add Variant
                  </button>
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick={() => setActiveProductId(product.id)}
                >
                  Next: Classify Product
                </button>
                <button
                  className="text-red-600 font-medium flex items-center justify-center"
                  onClick={() => {
  if (window.confirm(`Are you sure you want to remove the product "${product.name}" and all its variants? This action cannot be undone.`)) {
    removeProduct(product.id);
  }
}}
                >
                  <HelpCircle size={16} className="mr-1" /> Remove Product
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Product Context & Step Instruction */}
                <div className="mb-6">
                  <div className="text-lg font-bold text-gray-900 mb-1">{product.name}</div>
                  {/* Step Instruction */}
                  {(!product.classification.chapter) && (
                    <div className="text-purple-700 bg-purple-50 rounded px-3 py-2 mb-2 text-sm font-medium">
                      Step 1: Select the correct 2-digit HS Chapter for <span className="font-semibold">{product.name}</span> from the dropdown below.
                    </div>
                  )}
                  {(product.classification.chapter && !product.classification.heading) && (
                    <div className="text-purple-700 bg-purple-50 rounded px-3 py-2 mb-2 text-sm font-medium">
                      Step 2: Choose the 4-digit Heading that best matches <span className="font-semibold">{product.name}</span>.
                    </div>
                  )}
                  {(product.classification.chapter && product.classification.heading && !product.classification.subheading) && (
                    <div className="text-purple-700 bg-purple-50 rounded px-3 py-2 mb-2 text-sm font-medium">
                      Step 3: Select the 6-digit Subheading for <span className="font-semibold">{product.name}</span>.
                    </div>
                  )}
                </div>
                {/* Step 1: HS Code Step Help Banner */}
                <div className="flex items-start mb-4 bg-blue-50 border border-blue-200 rounded p-3">
                  <HelpCircle size={20} className="text-blue-400 mt-0.5 mr-2" />
                  <div>
                    <span className="font-semibold text-blue-700">HS Code Step 1: Chapter</span>
                    <div className="text-xs text-blue-700 mt-1">The chapter is the broadest category in the HS code system (first 2 digits). Choose the chapter that best matches your product type.</div>
                  </div>
                </div>
                {/* Chapter Selection */}
                <label className="block font-medium text-gray-700 mt-6 mb-2">Select HS Chapter</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <select 
                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                    value={product.classification.chapter?.code || ''}
                    onChange={(e) => {
                      const chapter = chapters.find(c => c.code === e.target.value);
                      selectChapter(product.id, chapter || null);
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

                {/* Step 2: Heading Selection */}
                {product.classification.chapter && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step 2: Select Heading (4-digit)
                    </label>
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm mb-6"
                      value={product.classification.heading?.code || ''}
                      onChange={e => {
                        const heading = headings[product.classification.chapter?.code || '']?.find(h => h.code === e.target.value);
                        selectHeading(product.id, heading || null);
                      }}
                    >
                      <option value="">Select a heading...</option>
                      {headings[product.classification.chapter.code]?.map(heading => (
                        <option key={heading.code} value={heading.code}>
                          {heading.code} - {heading.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* Step 3: Subheading Selection */}
                {product.classification.heading && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step 3: Select Subheading (6-digit)
                    </label>
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm mb-6"
                      value={product.classification.subheading?.code || ''}
                      onChange={e => {
                        const subheading = subheadings[product.classification.heading?.code || '']?.find(s => s.code === e.target.value);
                        selectSubheading(product.id, subheading || null);
                      }}
                    >
                      <option value="">Select a subheading...</option>
                      {subheadings[product.classification.heading.code]?.map(subheading => (
                        <option key={subheading.code} value={subheading.code}>
                          {subheading.code} - {subheading.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* Success State */}
                {product.classification.chapter && product.classification.heading && product.classification.subheading && (
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
                          {product.classification?.chapter?.code}
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                        <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                          {product.classification?.heading?.code?.slice(2)}
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                        <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                          {product.classification?.subheading?.code?.slice(4)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {product.classification?.chapter?.name} &gt; {product.classification?.heading?.name} &gt; {product.classification?.subheading?.name}
                      </div>
                    </div>
                    <button
                      className="text-purple-600 font-medium flex items-center justify-center mx-auto"
                      onClick={() => resetClassification(product.id)}
                    >
                      <Edit size={16} className="mr-1" /> Change classification
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 mt-10">
        <button
          className="text-primary underline flex items-center px-4 py-2"
          onClick={() => setActiveProductId(null)}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </button>
        <button
          className="bg-primary text-white px-8 py-2 rounded font-semibold shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => {
            // Validation: at least one variant selected
            const anySelected = products.some(product => product.variants && product.variants.some(v => v.selected));
            if (!anySelected) {
              setError('You must select at least one variant to proceed.');
              return;
            }
            setError(null);
            // Proceed to next step (classification)
            setActiveStep('classification');
          }}
        >
          Continue
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ProductClassification;