import React from 'react';
import { useScraping } from '../../context/ScrapingContext'; 

const RightPanel: React.FC = () => {
  const { isLoading, error, isInitialState, scrapedData } = useScraping();

  const renderStatus = () => {
    if (isLoading) {
      return <p className="text-sm text-gray-400 italic">Loading analysis...</p>;
    }
    if (error) {
      return (
        <div className="text-sm text-red-400 border border-red-500 p-2 rounded bg-red-900/30">
          <p className="font-semibold">Error:</p>
          <p>{error.message}</p>
          {error.resolutionHint && <p className="mt-1 italic text-xs">Suggestion: {error.resolutionHint}</p>}
        </div>
      );
    }
    if (isInitialState) {
      return <p className="text-sm text-gray-400 italic">Add website to begin analysis.</p>;
    }
    if (scrapedData) {
        return <p className="text-sm text-green-400 italic">Analysis available.</p>;
    }
    return <p className="text-sm text-gray-500 italic">Ready.</p>;
  };

  return (
    <aside className="bg-secondary text-white w-[320px] min-h-screen hidden lg:block p-4">
      <h2 className="text-xl font-bold mb-4">Context</h2>

      <div className="mb-4">
        {renderStatus()}
      </div>

      {scrapedData?.company?.name && (
          <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="font-semibold mb-2">Identified Company:</h3>
              <p className="text-sm">{scrapedData.company.name}</p>
          </div>
      )}

    </aside>
  );
};

export default RightPanel;
