import React from "react";

export type WebsiteInsight = {
  title: string;
  description: string;
  score?: number;
  type: "SEO" | "Performance" | "Design" | "Content" | "Other";
};

const mockInsights: WebsiteInsight[] = [
  {
    title: "SEO Score",
    description: "Your website ranks well for important keywords, but could improve meta descriptions.",
    score: 78,
    type: "SEO",
  },
  {
    title: "Performance",
    description: "Site loads in 2.3s, but image optimization could further improve speed.",
    score: 85,
    type: "Performance",
  },
  {
    title: "Design Consistency",
    description: "Brand colors and fonts are consistent, but some buttons lack contrast.",
    score: 90,
    type: "Design",
  },
  {
    title: "Content Quality",
    description: "Content is clear and engaging. Consider adding more FAQs.",
    score: 92,
    type: "Content",
  },
];

interface WebsiteAnalysisInsightsPanelProps {
  insights?: WebsiteInsight[];
  onNextStep?: () => void;
}

const WebsiteAnalysisInsightsPanel: React.FC<WebsiteAnalysisInsightsPanelProps> = ({ insights = mockInsights, onNextStep }) => (
  <div className="w-full max-w-xl mx-auto mt-4 animate-fade-in">
    <h2 className="text-xl font-bold mb-6 text-center">Website Insights</h2>
    <div className="grid gap-4">
      {insights.map((insight, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{insight.title}</h3>
            <p className="text-sm text-gray-700 mb-1">{insight.description}</p>
            {typeof insight.score === "number" && (
              <div className="text-xs text-gray-500">Score: <span className="font-bold">{insight.score}</span>/100</div>
            )}
          </div>
          <span className="inline-block px-3 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">{insight.type}</span>
        </div>
      ))}
    </div>
    <div className="mt-8 flex gap-4 justify-center">
      <button className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary">Download PDF</button>
      <button className="bg-white border border-primary text-primary px-6 py-2 rounded hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary">Share</button>
      {onNextStep && (
        <button
          className="bg-primary text-white px-8 py-2 rounded font-semibold shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onNextStep}
        >
          Next Step
        </button>
      )}
    </div>
  </div>
);

export default WebsiteAnalysisInsightsPanel;
