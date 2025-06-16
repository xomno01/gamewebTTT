import React, { useEffect, useState } from 'react';

interface GlobalMarqueeProps {
  message: string;
  duration?: number; 
  onComplete?: () => void; 
  isAdminDismissable?: boolean; // New prop
}

const GlobalMarquee: React.FC<GlobalMarqueeProps> = ({ message, duration = 180000, onComplete, isAdminDismissable }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) {
        setIsVisible(false);
        return;
    }
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onComplete]);

  const animationSpeedFactor = 25; 
  const animationDurationSeconds = Math.max(10, message.length / animationSpeedFactor);


  if (!isVisible || !message) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (onComplete) {
        onComplete();
    }
  };

  return (
    <div 
        className="fixed top-0 left-0 right-0 z-[200] bg-black/80 text-yellow-300 text-sm overflow-hidden whitespace-nowrap py-1 px-2 shadow-lg flex items-center justify-between"
    >
      <style>
        {`
          @keyframes tuTienGlobalMarqueeAnimation {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); } 
          }
          .marquee-content-wrapper {
            /* This wrapper is needed if the dismiss button causes issues with the animation target */
            display: inline-block;
            padding-left: 100%; 
            animation: tuTienGlobalMarqueeAnimation ${animationDurationSeconds}s linear infinite;
            flex-grow: 1; /* Allow it to take available space */
            overflow: hidden; /* Prevent content from pushing button out */
          }
        `}
      </style>
      <div className="marquee-content-wrapper">
        <span>{message}</span>
      </div>
      {isAdminDismissable && (
        <button 
            onClick={handleDismiss} 
            className="ml-2 px-1.5 py-0.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded-full focus:outline-none"
            aria-label="Tắt thông báo"
        >
          X
        </button>
      )}
    </div>
  );
};

export default GlobalMarquee;