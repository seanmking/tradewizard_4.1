// This is a mock API for website analysis. Replace with real backend integration when available.
import type { WebsiteInsight } from "../components/ui/WebsiteAnalysisInsightsPanel";

export async function analyzeWebsite(url: string): Promise<WebsiteInsight[]> {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 1800));
  // Return mock insights (real implementation will fetch from backend)
  return [
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
}
