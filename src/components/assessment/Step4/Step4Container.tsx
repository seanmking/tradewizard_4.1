import React, { useEffect } from 'react';
import { useAssessment } from '../../../context/AssessmentContext';
import CompanyCard from './CompanyCard';
import AISummaryBlock from './AISummaryBlock';
import ExportSignals from './ExportSignals';
import UncertaintiesCard from './UncertaintiesCard';
import ProductCard from './ProductCard';
import CertificationsChecklist from './CertificationsChecklist';

const Step4Container: React.FC = () => {
  const { state, dispatch } = useAssessment();
  const { summary, products, certifications, fallbackReason, confirmedProducts, showCompliance } = state;

  useEffect(() => {
    // TODO: fetch and dispatch initial data from API if needed
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div>
        <CompanyCard />
        <AISummaryBlock summary={summary} />
        <ExportSignals products={products} />
        <UncertaintiesCard fallbackReason={fallbackReason} />
      </div>

      {/* Right Column */}
      <div>
        {!showCompliance ? (
          <div>
            {products.map((product) => (
              <ProductCard key={product.id || `${product.name}-${product.category || ''}`} product={product} />
            ))}
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => {
                dispatch({ type: 'CONFIRM_PRODUCTS', payload: products });
                dispatch({ type: 'SHOW_COMPLIANCE', payload: true });
              }}
            >
              Continue to Compliance Requirements
            </button>
          </div>
        ) : (
          <CertificationsChecklist certifications={certifications} confirmedProducts={confirmedProducts} />
        )}
      </div>
    </div>
  );
};

export default Step4Container;
