import React, { ReactNode } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';

interface ThreePanelLayoutProps {
  children: ReactNode;
  currentStep: number;
  navigationTitle?: string;
}

const STEPS = [
  { id: 1, name: 'Business Profile' },
  { id: 2, name: 'Product Selection' },
  { id: 3, name: 'Production Capacity' },
  { id: 4, name: 'Target Markets' },
  { id: 5, name: 'Certifications' },
];

export default function ThreePanelLayout({ 
  children, 
  currentStep,
  navigationTitle = 'Export Assessment'
}: ThreePanelLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 w-full max-w-full mx-auto border border-gray-200 rounded-lg overflow-hidden shadow-lg bg-white flex flex-col">
        <div className="bg-purple-100 p-4 border-b border-gray-200">
          <h3 className="font-medium">Layout Structure</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
          {/* Left Panel */}
          <div className="col-span-12 md:col-span-2 bg-white border-r border-gray-200 p-4">
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-800">Export Assessment</h4>
              <p className="text-xs text-gray-500">Step 2 of 5</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center py-2 px-2 rounded-lg bg-gray-100">
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">1</div>
                <span className="ml-2 text-sm text-gray-500">Business Profile</span>
                <CheckCircle className="ml-auto text-green-500" size={12} />
              </div>
              <div className="flex items-center py-2 px-2 rounded-lg bg-purple-100">
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">2</div>
                <span className="ml-2 text-sm text-purple-700">Product Selection</span>
              </div>
              <div className="flex items-center py-2 px-2 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">3</div>
                <span className="ml-2 text-sm text-gray-400">Production Capacity</span>
              </div>
            </div>
          </div>

          {/* Center Panel */}
          <div className="col-span-12 md:col-span-5 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 mr-2 flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-xs">SA</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                <div className="text-purple-600 font-semibold text-sm">Sarah</div>
                <div className="text-sm">Let's classify your products with the correct HS codes.</div>
              </div>
            </div>
            <div className="flex justify-end mb-3">
              <div className="bg-purple-600 text-white rounded-lg p-3 max-w-[80%]">
                <div className="text-sm">What is an HS code?</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-800 mb-2">Select Products for Export</h3>
              <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                <div className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-purple-600" />
                  <span className="ml-2 text-sm font-medium">Premium Red Wine</span>
                </div>
              </div>
            </div>
            {children}
          </div>

          {/* Right Panel */}
          <div className="col-span-12 md:col-span-5 bg-gray-50 p-4 overflow-y-auto">
            <h3 className="text-base font-medium text-gray-800 mb-3">Product Classification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Accurate HS code classification is essential for determining tariffs, documentation requirements, and market-specific regulations.
            </p>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-4">
              <h4 className="text-sm font-medium text-blue-800">Market Insight</h4>
              <p className="text-xs text-blue-700 mt-1">
                South African exports that are properly classified typically clear customs 3x faster.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Classification Progress</h4>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Products Classified</span>
                <span className="font-medium">1 of 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
