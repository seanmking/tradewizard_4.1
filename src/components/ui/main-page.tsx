import React from 'react';
import ThreePanelLayout from './ThreePanelLayout';
import WebsiteAnalysisForm from './WebsiteAnalysisForm';

export default function MainPage() {
  return (
    <ThreePanelLayout currentStep={1} navigationTitle="Website Analysis">
      <WebsiteAnalysisForm />
    </ThreePanelLayout>
  );
}
