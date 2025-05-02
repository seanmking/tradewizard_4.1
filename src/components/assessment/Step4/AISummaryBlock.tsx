import React from 'react';

interface AISummaryBlockProps {
  summary: string;
}

const AISummaryBlock: React.FC<AISummaryBlockProps> = ({ summary }) => (
  <div className="p-4 bg-white border rounded shadow mt-4">
    <h3 className="text-lg font-semibold mb-2">Sarah’s Analysis</h3>
    {summary ? <p>{summary}</p> : <p className="text-gray-500">Sarah didn’t find a summary. Let’s update or retry.</p>}
  </div>
);

export default AISummaryBlock;
