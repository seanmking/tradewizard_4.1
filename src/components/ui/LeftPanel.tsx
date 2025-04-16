import React from 'react';

const LeftPanel: React.FC = () => {
  return (
    <aside className="bg-primary text-white w-[280px] min-h-screen hidden md:block p-4">
      <h2 className="text-xl font-bold mb-4">Navigation</h2>
      {/* Navigation items go here */}
    </aside>
  );
};

export default LeftPanel;
