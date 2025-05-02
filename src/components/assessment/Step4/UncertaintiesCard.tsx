import React from 'react';

interface UncertaintiesCardProps {
  fallbackReason: string | null;
}

const UncertaintiesCard: React.FC<UncertaintiesCardProps> = ({ fallbackReason }) => (
  <div className="p-4 bg-white border rounded shadow mt-4">
    <h3 className="text-lg font-semibold mb-2">Gaps & Uncertainties</h3>
    {fallbackReason ? (
      <p className="text-yellow-600">{fallbackReason}</p>
    ) : (
      <p className="text-gray-500">No uncertainties detected.</p>
    )}
  </div>
);

export default UncertaintiesCard;
