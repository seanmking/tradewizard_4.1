import React from "react";

const WebsiteAnalysisRightContextPanel: React.FC = () => (
  <aside className="flex flex-col gap-6 px-2 sm:px-0" aria-labelledby="website-analysis-context-heading">
    <h2 id="website-analysis-context-heading" className="sr-only">Website Analysis Contextual Help</h2>
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="font-semibold mb-2">Why start here?</h3>
      <p className="text-sm text-gray-700">Most SMEs start with website insights to unlock growth opportunities and benchmark their digital presence.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="font-semibold mb-2">Success Stats</h3>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        <li>87% of SMEs who analyze their website see measurable improvements in 30 days.</li>
        <li>Trusted by 1,200+ businesses in 8 countries.</li>
      </ul>
    </div>
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="font-semibold mb-2">Testimonials</h3>
      <blockquote className="border-l-4 border-primary pl-4 italic text-gray-700" aria-live="polite">
        “TradeWizard helped us double our online leads in just 2 weeks.”
        <footer className="not-italic mt-2 text-xs text-gray-500">— GreenRoots</footer>
      </blockquote>
    </div>
  </aside>
);

export default WebsiteAnalysisRightContextPanel;
