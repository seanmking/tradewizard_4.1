import React from 'react';
import WebsiteAnalysisForm from './WebsiteAnalysisForm';

const CenterPanel: React.FC = () => {
  return (
    <main className="flex-1 min-h-screen bg-white p-4">
      <h2 className="text-xl font-bold mb-4">Website Analysis</h2>
      <WebsiteAnalysisForm />
    </main>
  );
};

export default CenterPanel;
