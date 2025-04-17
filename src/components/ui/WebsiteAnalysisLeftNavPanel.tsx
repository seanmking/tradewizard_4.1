import React, { useState } from "react";

const WebsiteAnalysisLeftNavPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Website Analysis Steps" className="relative">
      <button
        className="md:hidden mb-4 px-3 py-2 bg-primary text-white rounded focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="website-analysis-nav-list"
      >
        {open ? "Hide Navigation" : "Show Navigation"}
      </button>
      <ul
        id="website-analysis-nav-list"
        className={`space-y-2 ${open ? "block" : "hidden"} md:block`}
        role="list"
      >
        <li className="font-bold text-primary">Step 1: Onboarding</li>
        <li className="font-bold text-primary/80">Step 2: Website Analysis</li>
        <li className="font-bold text-primary/60">Step 3: Product Classification</li>
      </ul>
      <div className="mt-8 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
        <span className="text-xs text-gray-600">In Progress</span>
      </div>
    </nav>
  );
};

export default WebsiteAnalysisLeftNavPanel;
