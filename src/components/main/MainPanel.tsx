import React from 'react';

const MainPanel: React.FC = () => {
  return (
    <section className="flex flex-col h-full p-8 justify-center items-center">
      <h1 className="text-2xl font-bold mb-4">Main Task Content</h1>
      <p className="text-gray-700">This is the center panel for main workflow content.</p>
    </section>
  );
};

export default MainPanel;
