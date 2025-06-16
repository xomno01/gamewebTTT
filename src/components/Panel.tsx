import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-[rgba(17,24,39,0.7)] border border-[#4a4a4a] rounded-xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-md ${className}`}>
      {title && (
        <h2 className="text-xl font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-2 mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Panel;