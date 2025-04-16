import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, Search, Edit } from 'lucide-react';

export default function ProductClassificationShowcase() {
  const [activeView, setActiveView] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TradeWizard 3.0 Product Classification</h1>
        <p className="text-gray-600 mb-8">Component showcase for the product classification module</p>
        
        {/* View Selector */}
        <div className="flex space-x-2 mb-8">
          <button 
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg ${activeView === 'overview' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveView('threePanel')}
            className={`px-4 py-2 rounded-lg ${activeView === 'threePanel' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Three-Panel Layout
          </button>
          <button 
            onClick={() => setActiveView('productCard')}
            className={`px-4 py-2 rounded-lg ${activeView === 'productCard' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Product Card
          </button>
          <button 
            onClick={() => setActiveView('classification')}
            className={`px-4 py-2 rounded-lg ${activeView === 'classification' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Classification Flow
          </button>
        </div>
        
        {/* View Content */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {activeView === 'overview' && <OverviewView />}
          {activeView === 'threePanel' && <ThreePanelView />}
          {activeView === 'productCard' && <ProductCardView />}
          {activeView === 'classification' && <ClassificationView />}
        </div>
      </div>
    </div>
  );
}

// Overview
function OverviewView() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">TradeWizard 3.0 UI Components</h2>
      <p className="text-gray-600 mb-6">
        This showcase demonstrates the key UI components of the Product Classification module for 
        TradeWizard 3.0, implementing a modern Next.js application with TypeScript and Tailwind CSS.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Three-Panel Layout</h3>
          <p className="text-gray-600 mb-3">The core UI structure with navigation, conversation, and context panels.</p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Left navigation panel (240px)</li>
            <li>Center conversation panel (55%)</li>
            <li>Right context panel (45%)</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Product Classification</h3>
          <p className="text-gray-600 mb-3">Cascading selection interface for HS code classification.</p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Expandable product cards</li>
            <li>Step-by-step selection workflow</li>
            <li>Hierarchical code navigation</li>
            <li>Success state confirmation</li>
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Conversation Panel</h3>
          <p className="text-gray-600 mb-3">AI-driven guidance through Sarah, the virtual assistant.</p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Conversational interface</li>
            <li>Contextual responses</li>
            <li>Quick-reply buttons</li>
            <li>Message history</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Context Panel</h3>
          <p className="text-gray-600 mb-3">Contextual information that supplements the conversation.</p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Classification progress</li>
            <li>Current product details</li>
            <li>Help information</li>
            <li>Market insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Three-Panel Layout
function ThreePanelView() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Three-Panel Layout</h2>
      <p className="text-gray-600 mb-6">
        The layout consists of three panels that work together to create a cohesive user experience.
      </p>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="bg-purple-100 p-4 border-b border-gray-200">
          <h3 className="font-medium">Layout Structure</h3>
        </div>
        <div className="grid grid-cols-12 h-96">
          {/* Left Panel */}
          <div className="col-span-2 bg-white border-r border-gray-200 p-4">
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
          <div className="col-span-5 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 mr-2">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-xs">SA</span>
                </div>
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
          </div>
          
          {/* Right Panel */}
          <div className="col-span-5 bg-gray-50 p-4 overflow-y-auto">
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-lg font-medium mb-2 text-purple-800">Left Panel</h3>
          <p className="text-sm text-purple-700 mb-3">Navigation & Progress Tracking</p>
          <ul className="list-disc pl-5 text-sm text-purple-700">
            <li>Fixed 240px width</li>
            <li>Step progress indicator</li>
            <li>Current step highlighting</li>
            <li>Completed step checkmarks</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium mb-2 text-blue-800">Center Panel</h3>
          <p className="text-sm text-blue-700 mb-3">Conversation & Main Workflow</p>
          <ul className="list-disc pl-5 text-sm text-blue-700">
            <li>55% of available width</li>
            <li>Sarah AI assistant interface</li>
            <li>Main form controls</li>
            <li>Progress controls</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-lg font-medium mb-2 text-green-800">Right Panel</h3>
          <p className="text-sm text-green-700 mb-3">Context & Information</p>
          <ul className="list-disc pl-5 text-sm text-green-700">
            <li>45% of available width</li>
            <li>Light gray background</li>
            <li>Contextual information</li>
            <li>Product details</li>
            <li>Help content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Product Card
function ProductCardView() {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [classified, setClassified] = useState([2]);
  
  const products = [
    { id: 1, name: 'Premium Red Wine', description: 'South African Cabernet Sauvignon, 750ml bottle', hsCode: '' },
    { id: 2, name: 'Organic Rooibos Tea', description: 'Loose leaf organic rooibos tea, 250g packaging', hsCode: '09.02.40' },
    { id: 3, name: 'Handcrafted Wooden Bowls', description: 'Artisanal wooden bowls made from local timber', hsCode: '' },
  ];
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Product Card Component</h2>
      <p className="text-gray-600 mb-6">
        The product card is the core interactive element for the classification process.
      </p>
      
      <div className="space-y-4 mb-8">
        {products.map(product => (
          <div 
            key={product.id}
            className={`bg-white rounded-xl shadow-sm transition-all duration-300 ease-in-out overflow-hidden
              ${expandedProduct === product.id ? 'border-2 border-purple-600 bg-purple-50' : 'border border-gray-200'}`}
          >
            {/* Product Card Header */}
            <div 
              className="p-4 flex items-center cursor-pointer"
              onClick={() => setExpandedProduct(product.id === expandedProduct ? null : product.id)}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    checked={classified.includes(product.id) || expandedProduct === product.id}
                    onChange={() => {
                      if (classified.includes(product.id)) {
                        setClassified(classified.filter(id => id !== product.id));
                      } else {
                        setClassified([...classified, product.id]);
                      }
                    }}
                  />
                  <h3 className="ml-3 text-base font-medium text-gray-900">{product.name}</h3>
                  
                  {product.hsCode && (
                    <div className="ml-3 px-3 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      HS Code: {product.hsCode}
                    </div>
                  )}
                </div>
                <p className="mt-1 ml-8 text-sm text-gray-500">{product.description}</p>
              </div>
              
              {expandedProduct === product.id ? (
                <ChevronDown className="text-gray-400" size={20} />
              ) : (
                <ChevronRight className="text-gray-400" size={20} />
              )}
            </div>
            
            {/* Expanded Classification UI would be here */}
            {expandedProduct === product.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-3 text-center py-4">
                  <div className="text-sm text-gray-600">
                    Classification interface would appear here with step-by-step process
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add Product Button */}
        <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all">
          <Plus size={16} className="mr-2" />
          Add another product
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-base font-medium mb-2">Product Card States</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
              <span>Default: Collapsed with minimal information</span>
            </li>
            <li className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-200 mr-2"></div>
              <span>Selected: Expanded with classification interface</span>
            </li>
            <li className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-200 mr-2"></div>
              <span>Classified: Shows HS code badge</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-base font-medium mb-2">Interaction Design</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <CheckCircle size={14} className="text-green-500 mr-2" />
              <span>Click to expand/collapse</span>
            </li>
            <li className="flex items-center">
              <CheckCircle size={14} className="text-green-500 mr-2" />
              <span>Checkbox to select for export</span>
            </li>
            <li className="flex items-center">
              <CheckCircle size={14} className="text-green-500 mr-2" />
              <span>Visual cues for classification status</span>
            </li>
            <li className="flex items-center">
              <CheckCircle size={14} className="text-green-500 mr-2" />
              <span>Smooth transitions between states</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Classification Flow
function ClassificationView() {
  const [step, setStep] = useState(1);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">HS Code Classification Flow</h2>
      <p className="text-gray-600 mb-6">
        The step-by-step process for classifying products with the correct HS codes.
      </p>
      
      {/* Step Navigation */}
      <div className="flex items-center mb-8">
        <div 
          className={`h-2 w-16 rounded-full cursor-pointer ${step >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`}
          onClick={() => setStep(1)}
        ></div>
        <div className="h-px w-8 bg-gray-200"></div>
        <div 
          className={`h-2 w-16 rounded-full cursor-pointer ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}
          onClick={() => setStep(2)}
        ></div>
        <div className="h-px w-8 bg-gray-200"></div>
        <div 
          className={`h-2 w-16 rounded-full cursor-pointer ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}
          onClick={() => setStep(3)}
        ></div>
        <div className="h-px w-8 bg-gray-200"></div>
        <div 
          className={`h-2 w-16 rounded-full cursor-pointer ${step >= 4 ? 'bg-purple-600' : 'bg-gray-200'}`}
          onClick={() => setStep(4)}
        ></div>
      </div>
      
      <div className="mb-8">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Step 1: Select Chapter (2-digit)</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Selection
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <select 
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a chapter...</option>
                  <option value="22">22 - Beverages, spirits and vinegar</option>
                  <option value="09">09 - Coffee, tea, maté and spices</option>
                  <option value="44">44 - Wood and articles of wood; wood charcoal</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 italic">
              The chapter is the broadest category in the HS classification system, represented by the first 2 digits.
            </p>
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Step 2: Select Heading (4-digit)</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heading Selection
              </label>
              <select 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="">Select a heading...</option>
                <option value="2204">2204 - Wine of fresh grapes, including fortified wines</option>
                <option value="2208">2208 - Spirits, liqueurs and other spirituous beverages</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 italic">
              The heading provides more specificity, narrowing down to a particular product category within the chapter.
            </p>
          </div>
        )}
        
        {step === 3 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Step 3: Select Subheading (6-digit)</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subheading Selection
              </label>
              <select 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="">Select a subheading...</option>
                <option value="220421">220421 - In containers holding 2 litres or less</option>
                <option value="220422">220422 - In containers holding more than 2 litres but not more than 10 litres</option>
                <option value="220429">220429 - Other</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 italic">
              The subheading provides the most specific classification, identifying detailed product characteristics.
            </p>
          </div>
        )}
        
        {step === 4 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Classification Complete</h3>
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Classification Complete!</h3>
              <p className="text-gray-600 mb-4">
                You've classified Premium Red Wine as:
              </p>
              <div className="inline-block bg-gray-100 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    22
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    04
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    21
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Beverages, spirits and vinegar &gt; Wine of fresh grapes &gt; In containers holding 2 litres or less
                </div>
              </div>
              <button 
                className="text-purple-600 font-medium flex items-center justify-center mx-auto"
                onClick={() => setStep(1)}
              >
                <Edit size={16} className="mr-1" /> Change classification
              </button>
            </div>
            <p className="text-sm text-gray-500 italic">
              The complete classification provides a unique identifier for the product in international trade.
            </p>
          </div>
        )}
      </div>
      
      {/* Step Navigation Buttons */}
      <div className="flex justify-between">
        <button 
          onClick={() => setStep(Math.max(1, step - 1))}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium bg-white hover:bg-gray-50"
          disabled={step === 1}
        >
          <ArrowLeft size={16} className="mr-2" />
          Previous Step
        </button>
        
        {step < 4 && (
          <button 
            onClick={() => setStep(Math.min(4, step + 1))}
            className="flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            Next Step
            <ArrowRight size={16} className="ml-2" />
          </button>
        )}
      </div>
      
      {/* Information Box */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-base font-medium text-blue-800 mb-2">Classification Tips</h3>
        <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
          <li>Start with the chapter that best describes the general category</li>
          <li>Be as specific as possible with each selection</li>
          <li>Consider the product's primary function, not its components</li>
          <li>When in doubt, consult with a trade specialist</li>
          <li>Correct classification is critical for determining applicable tariffs</li>
        </ul>
      </div>
    </div>
  );
}
