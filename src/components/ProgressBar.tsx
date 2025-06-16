import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, showPercentage }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="w-full bg-gray-700 rounded-full h-5 my-2 relative">
      <div 
        className="bg-yellow-400 h-5 rounded-full text-center text-black text-xs font-bold leading-5 transition-all duration-300 ease-linear"
        style={{ width: `${percentage}%` }}
      >
        {label && <span>{label}</span>}
        {showPercentage && percentage > 10 && <span className="absolute w-full text-center left-0">{`${Math.floor(percentage)}%`}</span>}
      </div>
    </div>
  );
};

export default ProgressBar;