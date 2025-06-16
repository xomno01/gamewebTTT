import React from 'react';
import { InventoryItem, BaseItem } from '../types';

interface ItemDisplayProps {
  item: InventoryItem | BaseItem;
  count?: number;
  showButton?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, count, showButton, onClick, isSelected }) => {
  const refineText = 'refineLevel' in item && item.refineLevel > 0 ? ` +${item.refineLevel}` : '';
  
  // Use the passed 'count' prop for display
  const displayCountText = count && count > 1 ? ` (x${count})` : '';


  const selectedClass = isSelected ? 'ring-2 ring-offset-1 ring-offset-gray-900 ring-pink-500' : ''; 
  
  const borderStyle = {
    borderLeft: `4px solid ${item.rarity.borderColorValue}`,
  };

  return (
    <div 
        className={`flex justify-between items-center text-sm p-2 bg-black/25 rounded ${item.rarity.bgColorClass || ''} ${selectedClass} ${onClick ? 'cursor-pointer hover:bg-black/40' : ''} transition-all duration-150`}
        onClick={onClick}
        style={borderStyle}
    >
      <div className="flex-grow overflow-hidden mr-2">
        <strong className={`${item.rarity.colorClass} ${item.rarity.animationClass || ''} truncate`}>
          {item.name}
          {refineText}
        </strong>
        {displayCountText && <span className="ml-1 text-gray-400 text-xs">{displayCountText}</span>}
        {item.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>}
      </div>
      {showButton && <div className="ml-auto flex-shrink-0">{showButton}</div>}
    </div>
  );
};

export default ItemDisplay;