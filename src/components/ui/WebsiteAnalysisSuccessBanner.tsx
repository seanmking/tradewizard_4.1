import React from "react";

type WebsiteAnalysisSuccessBannerProps = {
  message: string;
  onClose?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

const WebsiteAnalysisSuccessBanner: React.FC<WebsiteAnalysisSuccessBannerProps> = ({ message, onClose, ...props }) => (
  <div
    className="bg-green-100 border border-green-300 text-green-900 px-3 py-2 sm:px-4 sm:py-2 rounded mb-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-400"
    role="status"
    aria-live="polite"
    tabIndex={0}
    {...props}
  >
    <span>
      <strong>{/* i18n: Success: */}Success:</strong> {/* i18n: success message */}{message}
    </span>
    {onClose && (
      <button className="ml-4 text-green-700 underline focus:outline-none focus:ring-2 focus:ring-green-700" onClick={onClose}>
        {/* i18n: Dismiss */}Dismiss
      </button>
    )}
  </div>
);

export default WebsiteAnalysisSuccessBanner;
