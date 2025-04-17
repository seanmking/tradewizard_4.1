import React from "react";

const WebsiteAnalysisErrorMessageBanner: React.FC<{ error: string }> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded mt-4 text-sm">
      {error}
    </div>
  );
};

export default WebsiteAnalysisErrorMessageBanner;
