import React from 'react';
import ThreePanelLayout from './ThreePanelLayout';
import WebsiteAnalysisLeftNavPanel from './WebsiteAnalysisLeftNavPanel';
import WebsiteAnalysisCenterPanel from './WebsiteAnalysisCenterPanel';
import WebsiteAnalysisRightContextPanel from './WebsiteAnalysisRightContextPanel';

export default function MainPage() {
  return (
    <ThreePanelLayout
      left={<WebsiteAnalysisLeftNavPanel />}
      center={<WebsiteAnalysisCenterPanel />}
      right={<WebsiteAnalysisRightContextPanel />}
    />
  );
}
