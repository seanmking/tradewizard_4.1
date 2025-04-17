import React from 'react';
import ThreePanelLayout from '../components/ui/ThreePanelLayout';
import WebsiteAnalysisLeftNavPanel from '../components/ui/WebsiteAnalysisLeftNavPanel';
import ExportSummaryPanel from '../components/ui/ExportSummaryPanel';
import WebsiteAnalysisRightContextPanel from '../components/ui/WebsiteAnalysisRightContextPanel';

const ExportSummaryPage: React.FC = () => (
  <ThreePanelLayout
    left={<WebsiteAnalysisLeftNavPanel />}
    center={<ExportSummaryPanel />}
    right={<WebsiteAnalysisRightContextPanel />}
  />
);

export default ExportSummaryPage;
