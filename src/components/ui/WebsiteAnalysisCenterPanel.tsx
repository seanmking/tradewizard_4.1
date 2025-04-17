import React, { useState } from "react";
import WebsiteAnalysisTypingIndicator from "./WebsiteAnalysisTypingIndicator";
import WebsiteAnalysisHelpOptionsCard from "./WebsiteAnalysisHelpOptionsCard";
import WebsiteAnalysisLoadingProgressSteps from "./WebsiteAnalysisLoadingProgressSteps";
import WebsiteAnalysisErrorMessageBanner from "./WebsiteAnalysisErrorMessageBanner";
import WebsiteAnalysisDemoBanner from "./WebsiteAnalysisDemoBanner";
import WebsiteAnalysisSuccessBanner from "./WebsiteAnalysisSuccessBanner";
import WebsiteAnalysisInsightsPanel, { WebsiteInsight } from "./WebsiteAnalysisInsightsPanel";
import { analyzeWebsite } from "../../api/websiteAnalysis";
import { useRouter } from 'next/router';

const WebsiteAnalysisCenterPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [successBanner, setSuccessBanner] = useState(false);
  const [insights, setInsights] = useState<WebsiteInsight[] | undefined>(undefined);
  const router = useRouter();


  const handleAnalyze = () => {
    setError("");
    setSuccessBanner(false);
    if (!url.trim()) {
      setError("Please enter your business website URL.");
      return;
    }
    setLoading(true);
    analyzeWebsite(url)
      .then(data => {
        setInsights(data);
        setSuccessBanner(true);
      })
      .catch(() => {
        setError("Failed to analyze website. Please try again later.");
      })
      .finally(() => setLoading(false));
  };

  const [demoBanner, setDemoBanner] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto mt-6 px-2 sm:px-0">
      <h1 className="text-2xl font-bold text-center">Welcome to Website Analysis</h1>
      <div className="w-full flex flex-col items-center">
        <WebsiteAnalysisTypingIndicator />
        {successBanner && (
          <WebsiteAnalysisSuccessBanner
            message="Website analyzed successfully! Here are your insights."
            onClose={() => setSuccessBanner(false)}
          />
        )}
        {demoBanner && (
          <WebsiteAnalysisDemoBanner onClose={() => setDemoBanner(false)} aria-live="polite" role="status" />
        )}
        {successBanner ? (
          <>
            <WebsiteAnalysisInsightsPanel
              insights={insights}
              onNextStep={() => router.push('/product-classification')}
            />
            <div className="mt-6 flex justify-center">
              <button
                className="bg-primary text-white px-5 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary mt-4"
                onClick={() => {
                  setSuccessBanner(false);
                  setUrl("");
                  setInsights(undefined);
                }}
              >
                Analyze another website
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 w-full">
            <label htmlFor="website-url" className="block text-sm font-medium mb-2">Business Website URL</label>
            <input
              id="website-url"
              type="text"
              className="w-full border border-neutral-300 rounded px-2 py-1 mb-4"
              placeholder="e.g., www.greenroots.co.za"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={handleAnalyze}
              disabled={loading}
            >
              🔍 Analyze My Website
            </button>
            <div className="flex justify-between mt-3 text-xs text-primary underline cursor-pointer">
              <span onClick={() => setDemoBanner(true)}>See Example</span>
              <span onClick={() => setTourOpen(true)}>Take Tour</span>
            </div>
            <WebsiteAnalysisErrorMessageBanner error={error} aria-live="assertive" />
          </div>
        )}
        <WebsiteAnalysisLoadingProgressSteps loading={loading} />
        <WebsiteAnalysisHelpOptionsCard />
        {tourOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="website-analysis-tour-title"
            tabIndex={-1}
            onKeyDown={e => {
              if (e.key === 'Escape') setTourOpen(false);
            }}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
              tabIndex={0}
              aria-describedby="website-analysis-tour-desc"
            >
              <h2 id="website-analysis-tour-title" className="text-xl font-bold mb-4">{/* i18n: Website Analysis Tour */}Website Analysis Tour</h2>
              <p id="website-analysis-tour-desc" className="mb-6">{/* i18n: Welcome! Enter your business website URL above and click "Analyze My Website" to see how TradeWizard generates actionable insights. You can also try the demo or get help if you're unsure. */}Welcome! Enter your business website URL above and click "Analyze My Website" to see how TradeWizard generates actionable insights. You can also try the demo or get help if you're unsure.</p>
              <button
                className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition"
                onClick={() => setTourOpen(false)}
                aria-label="Close Tour"
              >{/* i18n: Close Tour */}Close Tour</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteAnalysisCenterPanel;
