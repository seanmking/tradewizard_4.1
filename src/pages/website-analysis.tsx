import React from 'react';
import Head from 'next/head';
import ThreePanelLayout from '../components/ui/ThreePanelLayout';
import WebsiteAnalysisLeftNavPanel from '../components/ui/WebsiteAnalysisLeftNavPanel';
import WebsiteAnalysisCenterPanel from '../components/ui/WebsiteAnalysisCenterPanel';
import WebsiteAnalysisRightContextPanel from '../components/ui/WebsiteAnalysisRightContextPanel';

const WebsiteAnalysisPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Website Analysis | TradeWizard 4.1</title>
      </Head>
      <ThreePanelLayout
        left={<WebsiteAnalysisLeftNavPanel />}
        center={<WebsiteAnalysisCenterPanel />}
        right={<WebsiteAnalysisRightContextPanel />}
      />
    </>
  );
};

export default WebsiteAnalysisPage;
