import React, { useState } from 'react';
import { Player, InventoryItem } from '../types';
import { ITEM_DB, RARITY_LEVELS, GAME_DATA } from '../constants';
import { formatNumber } from '../utils/formatters';
import { countItemInInventory } from '../utils/playerUtils';
import TabButton from './TabButton';
import ItemDisplay from './ItemDisplay';
import ActionButton from './ActionButton';

interface CraftingTabProps {
  player: Player;
  onRefineItem: (instanceId: string) => void;
  onCraftTalisman: (recipeId: string) => void;
  addLog: (message: string, colorClass?: string) => void;
}

const CraftingTab: React.FC<CraftingTabProps> = ({ player, onRefineItem, onCraftTalisman, addLog }) => {
  const [activeCraftTab, setActiveCraftTab] = useState<'refine' | 'talisman'>('refine');

  const equippableItems = Object.values(player.inventory).filter(i => i.type === 'equipment');

  return (
    <div className="mt-4">
      <div className="flex border-b border-gray-700 mb-4">
        <TabButton onClick={() => setActiveCraftTab('refine')} isActive={activeCraftTab === 'refine'}>
          Luyện Khí
        </TabButton>
        <TabButton onClick={() => setActiveCraftTab('talisman')} isActive={activeCraftTab === 'talisman'}>
          Luyện Phù
        </TabButton>
      </div>

      {activeCraftTab === 'refine' && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Cường hóa trang bị để tăng thuộc tính. Cần 'Đá Cường Hóa' và Linh Thạch. Cấp cao có tỉ lệ thất bại!</p>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {equippableItems.length === 0 && <p className="text-sm text-gray-400">Không có trang bị để cường hóa.</p>}
            {equippableItems.map(item => {
              const refineLevel = item.refineLevel || 0;
              const cost = (refineLevel + 1) * 1000;
              const materialCost = Math.ceil((refineLevel + 1) / 2);
              const desc = `Cần: ${formatNumber(cost)} LT, ${materialCost} Đá Cường Hóa`;
              return (
                <ItemDisplay
                  key={item.instanceId}
                  item={{...item, description: desc}}
                  showButton={
                    <ActionButton
                      onClick={() => onRefineItem(item.instanceId)}
                      className="text-xs !p-1 !mb-0 !bg-purple-600 hover:!bg-purple-500"
                      fullWidth={false}
                    >
                      Cường Hóa
                    </ActionButton>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {activeCraftTab === 'talisman' && (
         <div>
          <p className="text-sm text-gray-400 mb-2">Chế tạo các loại Thần Phù từ 'Phù Chỉ' và các loại vật liệu khác.</p>
          <div className="space-y-2">
            {GAME_DATA.talismanRecipes.length === 0 && <p className="text-sm text-gray-400">Chưa có công thức luyện phù nào.</p>}
            {GAME_DATA.talismanRecipes.map(recipe => {
              const materialsNeeded = Object.entries(recipe.materials)
                .map(([itemId, amount]) => `${ITEM_DB[itemId]?.name || 'Unknown Material'} x${amount}`)
                .join(', ');
              const canCraft = Object.entries(recipe.materials).every(([itemId, amount]) => countItemInInventory(player.inventory, itemId) >= amount);

              return (
                 <ItemDisplay
                    key={recipe.id}
                    item={{
                        id: recipe.id,
                        name: recipe.name,
                        type: 'talisman', // Or a more specific type if needed
                        rarity: recipe.rarity,
                        description: `Cần: ${materialsNeeded}. ${recipe.desc}`,
                    }}
                    showButton={
                        <ActionButton
                        onClick={() => {
                            if (canCraft) {
                                onCraftTalisman(recipe.id);
                            } else {
                                addLog("Không đủ nguyên liệu để chế tạo Thần Phù này!", "text-red-400");
                            }
                        }}
                        disabled={!canCraft}
                        className="text-xs !p-1 !mb-0 !bg-blue-600 hover:!bg-blue-500 disabled:!bg-gray-600"
                        fullWidth={false}
                        >
                        Chế Tạo
                        </ActionButton>
                    }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CraftingTab;