import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const steps = [
  "Validating URL",
  "Fetching website data",
  "Analyzing content",
  "Generating insights",
];

const WebsiteAnalysisLoadingProgressSteps: React.FC<{ loading: boolean }> = ({ loading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      return;
    }
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;
  return (
    <div
      className="w-full mt-6 focus:outline-none focus:ring-2 focus:ring-primary"
      tabIndex={0}
      aria-live="polite"
      role="status"
    >
      <ul className="space-y-2">
        {steps.map((step, idx) => (
          <li key={step} className="flex items-center gap-2">
            <span>
              {idx <= currentStep ? (
                <CheckCircle className="text-green-500" size={18} />
              ) : (
                <span className="w-4 h-4 border-2 border-gray-300 rounded-full inline-block" />
              )}
            </span>
            <span className={idx <= currentStep ? "text-gray-900" : "text-gray-400"}>{/* i18n: step label */}{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WebsiteAnalysisLoadingProgressSteps;
