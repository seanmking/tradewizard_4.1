import React, { ReactNode } from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

interface LayoutProps {
  children: React.ReactNode;
}

import ThreePanelLayout from './ThreePanelLayout';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ThreePanelLayout
      left={<LeftPanel />}
      center={<CenterPanel />}
      right={<RightPanel />}
    />
  );
};

export default Layout;
