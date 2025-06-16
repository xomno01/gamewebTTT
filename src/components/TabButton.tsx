import React from 'react';

interface TabButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ onClick, isActive, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t-lg cursor-pointer transition-colors duration-200 focus:outline-none
        ${isActive 
          ? 'bg-[#4a5568] text-[#f6ad55]' // active: bg-gray-700, text-rarity-legendary
          : 'bg-[#2d3748] text-gray-300 hover:bg-[#374151]' // inactive: bg-gray-800
        }`}
    >
      {children}
    </button>
  );
};

export default TabButton;