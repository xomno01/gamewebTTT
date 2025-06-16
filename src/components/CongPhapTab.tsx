import React from 'react';
import { Player, InventoryItem, ItemBonus } from '../types';
import ItemDisplay from './ItemDisplay';
import ActionButton from './ActionButton';

interface CongPhapTabProps {
  player: Player;
  onLearnCongPhap: (instanceId: string) => void;
  onAbandonCongPhap: (index: number) => void;
}

const statKeyToVietnamese = (key: string): string => {
  const map: Record<string, string> = {
    attack: "Công Lực",
    defense: "Phòng Thủ",
    hp: "Sinh Lực",
    critChance: "Tỷ Lệ Bạo Kích",
    critDamage: "S.Thương Bạo Kích",
    lifeSteal: "Hút Sinh Lực",
    damageReduction: "Giảm S.Thương",
    allStatsPercent: "Tất Cả Thuộc Tính %",
    attackPercent: "Công Lực %",
    defensePercent: "Phòng Thủ %",
    hpPercent: "Sinh Lực %",
    tuviRatePercent: "Tốc Độ Tu Vi %",
    dodgeChance: "Né Tránh %",
    accuracy: "Chính Xác %", // Assuming accuracy from bonus is percentage, adjust if flat
    luck: "May Mắn %", // Assuming luck from bonus is percentage
    linhThachFindPercent: "% Tìm Linh Thạch"
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
};


const CongPhapTab: React.FC<CongPhapTabProps> = ({ player, onLearnCongPhap, onAbandonCongPhap }) => {
  const unlearnedCongPhap = Object.values(player.inventory).filter(item => item.type === 'congPhap');

  const formatBonus = (bonus: ItemBonus | undefined): string => {
    if (!bonus) return '';
    return Object.entries(bonus)
      .map(([key, value]) => {
        const vietnameseKey = statKeyToVietnamese(key);
        if (typeof value === 'number') {
          // Assuming percentage values are < 1, flat values are >=1 or handled by key name
          if (key.includes('Percent') || key === 'critChance' || key === 'critDamage' || key === 'lifeSteal' || key === 'damageReduction' || key === 'dodgeChance' || key === 'luck') {
            return `${vietnameseKey}: ${(value * 100).toFixed(0)}%`;
          }
          return `${vietnameseKey}: ${value}`;
        }
        return `${vietnameseKey}: ${value}`;
      })
      .join(', ');
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2">Công Pháp Đã Học (Tối đa 5)</h3>
      <div className="space-y-2 mb-4">
        {player.congPhap.length === 0 && <p className="text-sm text-gray-400">Chưa học công pháp nào.</p>}
        {player.congPhap.map((cp, index) => (
          <ItemDisplay
            key={cp.instanceId}
            item={{...cp, description: formatBonus(cp.bonus)}}
            showButton={
              <ActionButton
                onClick={() => onAbandonCongPhap(index)}
                className="text-xs !p-1 !mb-0 !bg-red-600 hover:!bg-red-500"
                fullWidth={false}
              >
                Hủy Bỏ
              </ActionButton>
            }
          />
        ))}
      </div>

      <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2 mt-6">Bí Tịch trong túi</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
        {unlearnedCongPhap.length === 0 && <p className="text-sm text-gray-400">Không có bí tịch nào.</p>}
        {unlearnedCongPhap.map(cp => (
          <ItemDisplay
            key={cp.instanceId}
            item={{...cp, description: formatBonus(cp.bonus)}}
            showButton={
              <ActionButton
                onClick={() => onLearnCongPhap(cp.instanceId)}
                disabled={player.congPhap.length >= 5}
                className="text-xs !p-1 !mb-0 !bg-green-600 hover:!bg-green-500 disabled:!bg-gray-600"
                fullWidth={false}
              >
                Học
              </ActionButton>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default CongPhapTab;