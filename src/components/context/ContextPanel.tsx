import React from 'react';

const ContextPanel: React.FC = () => {
  return (
    <aside className="flex flex-col h-full p-6">
      <h2 className="text-lg font-semibold mb-4">Contextual Help</h2>
      <div className="text-gray-600 text-sm">
        {/* Add dynamic help or insights here */}
        <p>Helpful tips and guidance will appear here based on your current step.</p>
      </div>
    </aside>
  );
};

export default ContextPanel;
