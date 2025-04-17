import React, { useEffect, useState } from "react";

const TYPING_DELAY = 800; // ms
const MESSAGE_DELAY = 1200; // ms

const WebsiteAnalysisTypingIndicator: React.FC = () => {
  const [showTyping, setShowTyping] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const typingTimer = setTimeout(() => setShowTyping(true), TYPING_DELAY);
    const messageTimer = setTimeout(() => setShowMessage(true), TYPING_DELAY + MESSAGE_DELAY);
    return () => {
      clearTimeout(typingTimer);
      clearTimeout(messageTimer);
    };
  }, []);

  if (!showTyping) return null;
  return (
    <div
      className="bg-neutral-100 rounded-lg px-3 py-2 sm:px-4 sm:py-2 mb-4 w-full text-center animate-pulse min-h-[32px] focus:outline-none focus:ring-2 focus:ring-primary"
      tabIndex={0}
      aria-live="polite"
      role="status"
    >
      {showMessage ? (
        <span className="text-sm sm:text-base text-neutral-700">{/* i18n: Hi, I’m Sarah. Let’s analyze your website for quick wins! */}Hi, I’m Sarah. Let’s analyze your website for quick wins!</span>
      ) : (
        <span className="text-sm sm:text-base text-neutral-600">{/* i18n: Sarah is typing... */}Sarah is typing...</span>
      )}
    </div>
  );
};

export default WebsiteAnalysisTypingIndicator;
