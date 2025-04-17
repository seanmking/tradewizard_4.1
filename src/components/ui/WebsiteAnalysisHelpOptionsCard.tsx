import React, { useState } from "react";

const WebsiteAnalysisHelpOptionsCard: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-blue-50 border border-blue-200 rounded mt-4 p-3 sm:p-4 w-full text-xs text-blue-700" role="region" aria-label="Website URL Help">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span>
          Not sure?{' '}
          <button
            className="underline focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-controls="website-url-help-details"
          >
            {expanded ? "Hide help" : "Get help with your website URL."}
          </button>
        </span>
        <span className="ml-0 sm:ml-2 text-primary underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary" tabIndex={0} onClick={() => alert('Demo Mode!')}>See Example</span>
        <span className="ml-0 sm:ml-2 text-primary underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary" tabIndex={0} onClick={() => alert('Tour Mode!')}>Take Tour</span>
      </div>
      {expanded && (
        <div className="mt-2 text-blue-800" id="website-url-help-details">
          <ul className="list-disc ml-6">
            <li>Check your browser address bar for your business website URL.</li>
            <li>If you don’t have a website, <a href="mailto:support@tradewizard.com" className="underline">contact support</a> for guidance.</li>
            <li>Try our demo to see how it works!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebsiteAnalysisHelpOptionsCard;
