import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronDown, Plus, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, Search, Edit } from 'lucide-react';
import { useProductClassification } from '../context/ProductClassificationContext';
import { chapters, headings, subheadings, sampleProducts } from '../data/hs-code-data';

const ProductClassification: React.FC = () => {
  // New state for incremental workflow
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
    toggleVariantSelection,
  } = useProductClassification();

  const router = useRouter();

  // Remove legacy useEffect and addProduct logic. Only use context-driven UI.


  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Select Products for Export</h1>
        <p className="text-gray-600 mt-2">We&apos;ve detected these products from your website. Select the ones you plan to export.</p>
      </div>
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
                    </label>
                  ))}
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick={() => setActiveProductId(product.id)}
                >
                  Next: Classify Product
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
                {/* Step 1: Chapter Selection */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Step 1: Select Chapter (2-digit)
                </label>
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
          onClick={() => activeProductId && resetClassification(activeProductId)}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </button>
        <button
          className="bg-primary text-white px-8 py-2 rounded font-semibold shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Continue
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ProductClassification;