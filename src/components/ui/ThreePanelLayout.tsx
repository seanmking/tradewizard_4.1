import React, { ReactNode } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';

interface ThreePanelLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({ left, center, right }) => (
  <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
    <aside className="md:w-1/5 w-full bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 flex-shrink-0">
      {left}
    </aside>
    <main className="md:w-3/5 w-full p-4 flex-1 flex flex-col items-center justify-center">
      {center}
    </main>
    <aside className="md:w-1/5 w-full bg-white border-t md:border-t-0 md:border-l border-gray-200 p-4 flex-shrink-0">
      {right}
    </aside>
  </div>
);

export default ThreePanelLayout;
