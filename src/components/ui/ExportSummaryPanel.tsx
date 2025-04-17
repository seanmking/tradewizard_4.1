import React from "react";

const ExportSummaryPanel: React.FC = () => (
  <div className="w-full max-w-xl mx-auto mt-8 animate-fade-in">
    <h2 className="text-2xl font-bold mb-6 text-center">Export Summary</h2>
    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
      <div className="text-lg text-gray-700">
        <strong>Congratulations!</strong> You’ve completed the product classification step.
      </div>
      <div className="text-base text-gray-600">
        Here’s a summary of your selected products and their export classifications. You can now proceed to generate export documentation or review your selections.
      </div>
      {/* Placeholder for summary table/list */}
      <div className="bg-gray-50 rounded p-4 text-center text-gray-500">
        (Product summary table goes here)
      </div>
      <div className="mt-6 flex gap-4 justify-center">
        <button className="bg-primary text-white px-8 py-2 rounded font-semibold shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary">
          Generate Export Docs
        </button>
        <button className="bg-white border border-primary text-primary px-8 py-2 rounded font-semibold shadow hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary">
          Review Products
        </button>
      </div>
    </div>
  </div>
);

export default ExportSummaryPanel;
