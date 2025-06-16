import React, { useState, useEffect } from 'react';
import { InventoryItem, Rarity } from '../types';
import { ALL_RARITIES_ORDERED } from '../constants';
import ItemDisplay from './ItemDisplay';
import ActionButton from './ActionButton';

interface GachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  gachaResult: InventoryItem[];
  onSellSelected: (instanceIds: string[]) => void;
}

const GachaModal: React.FC<GachaModalProps> = ({ isOpen, onClose, gachaResult, onSellSelected }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]); // Reset selection when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItemSelection = (instanceId: string) => {
    setSelectedItems(prev => 
      prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]
    );
  };

  const selectByRarity = (rarityName: string) => {
    const itemsOfRarity = gachaResult.filter(item => item.rarity.name === rarityName).map(item => item.instanceId);
    // If all items of this rarity are already selected, deselect them. Otherwise, select them.
    const allSelected = itemsOfRarity.every(id => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !itemsOfRarity.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...itemsOfRarity])]);
    }
  };

  const handleSell = () => {
    onSellSelected(selectedItems);
    // Items will be removed from gachaResult by parent, modal will re-render or close
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1f2937] w-full max-w-3xl rounded-xl p-6 shadow-xl border border-gray-700 max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-2 mb-4">Kết Quả Quay Thưởng</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{maxHeight: '50vh'}}>
          {gachaResult.map(item => (
            <ItemDisplay
              key={item.instanceId}
              item={item}
              onClick={() => toggleItemSelection(item.instanceId)}
              isSelected={selectedItems.includes(item.instanceId)}
            />
          ))}
           {gachaResult.length === 0 && <p className="text-gray-400 col-span-full text-center">Không có vật phẩm nào.</p>}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-600">
          <h3 className="font-bold text-lg mb-2 text-gray-200">Thu Dọn (Chọn Vật Phẩm Để Bán)</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {ALL_RARITIES_ORDERED.map(r => (
              <button
                key={r.name}
                onClick={() => selectByRarity(r.name)}
                className={`px-2 py-1 text-xs rounded border-l-4 ${r.borderColorClass} ${r.colorClass} bg-gray-700 hover:bg-gray-600 transition-colors`}
              >
                {r.name}
              </button>
            ))}
          </div>
          <div className="flex justify-start gap-4">
            <ActionButton
              onClick={handleSell}
              disabled={selectedItems.length === 0}
              className="!bg-red-600 hover:!bg-red-500 w-auto"
              fullWidth={false}
            >
              Bán Đã Chọn ({selectedItems.length})
            </ActionButton>
            <ActionButton onClick={onClose} className="w-auto" fullWidth={false}>
              Đóng
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GachaModal;