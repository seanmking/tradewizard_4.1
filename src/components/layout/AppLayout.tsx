import React from 'react';

interface AppLayoutProps {
  leftPanel?: React.ReactNode;
  centerPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

import ThreePanelLayout from '../ui/ThreePanelLayout';

const AppLayout: React.FC<AppLayoutProps> = ({ leftPanel, centerPanel, rightPanel }) => {
  return (
    <ThreePanelLayout
      left={leftPanel}
      center={centerPanel}
      right={rightPanel}
    />
  );
};

export default AppLayout;
