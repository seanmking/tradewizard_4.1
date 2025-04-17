import React from 'react';

const NavigationPanel: React.FC = () => {
  return (
    <nav className="flex flex-col h-full p-6">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      {/* Add navigation/progress items here */}
      <ul className="space-y-2 text-gray-700">
        <li>Step 1: Onboarding</li>
        <li>Step 2: Website Analysis</li>
        <li>Step 3: Product Classification</li>
      </ul>
    </nav>
  );
};

export default NavigationPanel;
