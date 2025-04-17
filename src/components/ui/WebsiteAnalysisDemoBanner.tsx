import React from "react";

type WebsiteAnalysisDemoBannerProps = {
  onClose?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

const WebsiteAnalysisDemoBanner: React.FC<WebsiteAnalysisDemoBannerProps> = ({ onClose, ...props }) => (
  <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-2 rounded mb-4 flex items-center justify-between" {...props}>
    <span>
      <strong>Demo Mode:</strong> This is a live demo. No real website data will be analyzed.
    </span>
    {onClose && (
      <button className="ml-4 text-yellow-700 underline" onClick={onClose}>Dismiss</button>
    )}
  </div>
);


export default WebsiteAnalysisDemoBanner;
