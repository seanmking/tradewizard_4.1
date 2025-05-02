import React from 'react';
import { Product } from '../../../context/AssessmentContext';

interface ExportSignalsProps {
  products: Product[];
}

const ExportSignals: React.FC<ExportSignalsProps> = ({ products }) => (
  <div className="p-4 bg-white border rounded shadow mt-4">
    <h3 className="text-lg font-semibold mb-2">Export Signals</h3>
    {products.length > 0 ? (
      <ul className="list-disc list-inside">
        {products.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">No product details detected yet.</p>
    )}
  </div>
);

export default ExportSignals;
