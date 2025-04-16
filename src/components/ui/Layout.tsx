import React, { ReactNode } from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
      {children}
    </div>
  );
};

export default Layout;
