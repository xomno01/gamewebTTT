import React, { useState } from 'react';
import { Player, EquipmentSlot, SectMembershipInfo, GlobalConfigOverrides, ActiveBuff } from '../types';
import { GAME_DATA, EQUIPMENT_SLOT_NAMES, MAP_DATA } from '../constants';
import { formatNumber } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import ActionButton from './ActionButton';

interface CharacterTabProps {
  player: Player;
  onCharacterNameChange: (newName: string) => void; 
  onLogout: () => void;
  activeGlobalConfig: GlobalConfigOverrides; 
  // onExportData: () => void; // Removed
  // onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void; // Removed
}

const formatDuration = (ms: number): string => {
    if (ms <= 0) return "Hết hạn";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
};

const CharacterTab: React.FC<CharacterTabProps> = ({ player, onCharacterNameChange, onLogout, activeGlobalConfig }) => {
  const currentLevelData = GAME_DATA.levels[player.level];
  const currentMap = MAP_DATA.find(m => m.id === player.currentMapId) || MAP_DATA[0];
  
  let tuviPerSecond = (currentLevelData.stats.tuviBase as number) * (1 + (player.totalStats.tuviRatePercent || 0));
  if (currentMap && currentMap.tuViYieldModifier) {
    tuviPerSecond *= currentMap.tuViYieldModifier(player.level, player.totalStats, activeGlobalConfig);
  }

  const [editingName, setEditingName] = useState(false);
  const [currentNameInput, setCurrentNameInput] = useState(player.characterName);

  const handleSaveName = () => {
    if (currentNameInput.trim()) {
      onCharacterNameChange(currentNameInput.trim());
      setEditingName(false);
    }
  };

  const statEntries = {
    'Sinh Lực': <span className="text-green-400">{formatNumber(player.hp)}/{formatNumber(player.totalStats.hp)}</span>,
    'Công Lực': <span className="text-red-400">{formatNumber(player.totalStats.attack)}</span>,
    'Phòng Thủ': <span className="text-blue-400">{formatNumber(player.totalStats.defense)}</span>,
    'Chí Mạng': <span className="text-yellow-400">{((player.totalStats.critChance || 0) * 100).toFixed(1)}%</span>,
    'S.Thương Bạo': <span className="text-yellow-500">{((player.totalStats.critDamage || 0) * 100).toFixed(0)}%</span>,
    'Hút Huyết': <span className="text-red-500">{((player.totalStats.lifeSteal || 0) * 100).toFixed(1)}%</span>,
    'Giảm S.Thương': <span className="text-indigo-400">{((player.totalStats.damageReduction || 0) * 100).toFixed(1)}%</span>,
    'Né Tránh': <span className="text-teal-400">{((player.totalStats.dodgeChance || 0) * 100).toFixed(1)}%</span>,
    'Chính Xác': <span className="text-sky-400">{((player.totalStats.accuracy || 0) * 100).toFixed(1)}%</span>,
    'May Mắn': <span className="text-lime-400">{((player.totalStats.luck || 0) * 100).toFixed(1)}%</span>,
    '% Tìm LT': <span className="text-amber-400">{((player.totalStats.linhThachFindPercent || 0) * 100).toFixed(1)}%</span>,
    'Linh Thạch': <span className="text-cyan-400">{player.linhThach.toLocaleString('en-US')}</span>,
  };
  
  const permanentBonusStats = {
    'Công Lực Gốc+': player.baseStats.permanentAtk,
    'Phòng Thủ Gốc+': player.baseStats.permanentDef,
    'Sinh Lực Gốc+': player.baseStats.permanentHp,
  };

  const displayCharacterName = player.playerSectTitle 
    ? <><span className={`${player.playerSectTitle.styleClass} mr-1`}>{player.playerSectTitle.title}</span> {player.characterName}</>
    : player.characterName;

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
         {editingName ? (
            <div className="inline-flex items-center">
                <input 
                    type="text" 
                    value={currentNameInput}
                    onChange={(e) => setCurrentNameInput(e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded-md text-sm border border-gray-600 focus:border-yellow-500 outline-none"
                    maxLength={20}
                />
                <button onClick={handleSaveName} className="ml-2 text-xs bg-green-500 hover:bg-green-400 text-black px-2 py-1 rounded">Lưu</button>
                <button onClick={() => {setEditingName(false); setCurrentNameInput(player.characterName);}} className="ml-1 text-xs bg-gray-500 hover:bg-gray-400 text-black px-2 py-1 rounded">Hủy</button>
            </div>
        ) : (
            <div className="text-lg">
                <strong>Tên:</strong>
                <span className="ml-1">{displayCharacterName}</span> 
                <button onClick={() => {setEditingName(true); setCurrentNameInput(player.characterName);}} className="ml-1 text-xs text-yellow-400 hover:text-yellow-300">(Đổi)</button>
            </div>
        )}
        <ActionButton onClick={onLogout} className="!w-auto !py-1 !px-3 text-xs !bg-red-700 hover:!bg-red-600" fullWidth={false}>
            Đăng Xuất
        </ActionButton>
      </div>
      <div><strong>Lực Chiến:</strong> <span className="text-orange-400 font-bold">{formatNumber(player.combatPower)}</span></div>
      <div>
        <strong>Trạng Thái:</strong> 
        <span className={`font-bold ml-1 ${player.status === 'meditating' ? 'text-red-500 animate-pulse' : player.status === 'exploring' ? 'text-blue-400 animate-pulse' : player.status === 'fightingBoss' ? 'text-purple-400 animate-pulse' : 'text-green-500'}`}>
            {player.status === 'meditating' ? 'Đang Tịnh Dưỡng' : player.status === 'exploring' ? 'Đang Thám Hiểm' :  player.status === 'fightingBoss' ? 'Đang Chiến Boss' : 'Bình thường'}
        </span>
      </div>
      <div><strong>Cảnh Giới:</strong> <span className="text-yellow-400 font-bold">{currentLevelData.majorRealmName} - {currentLevelData.subTierName} (Cấp QT: {player.level})</span></div>
      <div><strong>Khu Vực:</strong> <span className="text-purple-300 font-semibold">{currentMap.name}</span></div>
      
      <ProgressBar value={player.tuvi} max={currentLevelData.tuviMax} showPercentage={true}/>
      <div className="text-center text-sm mb-1">
        <span>{formatNumber(player.tuvi)}</span> / <span>{formatNumber(currentLevelData.tuviMax)}</span>
      </div>
      <div className="text-center text-xs text-yellow-300 mb-4">Tu Vi/s: {formatNumber(tuviPerSecond)} ({player.offlineCultivationActiveUntil && Date.now() < player.offlineCultivationActiveUntil ? 'Offline 1/3' : currentMap.name})</div>

      {player.activeBuffs && player.activeBuffs.length > 0 && (
        <div className="my-3 p-2 bg-gray-700/50 rounded-md border border-gray-600">
            <h4 className="text-sm font-semibold text-yellow-300 mb-1">Hiệu Ứng Thần Phù:</h4>
            <div className="space-y-0.5 text-xs">
                {player.activeBuffs.map(buff => (
                    <div key={buff.id} className="flex justify-between items-center text-sky-300">
                        <span>{buff.icon} {buff.name}</span>
                        <span>{formatDuration(buff.expiresAt - Date.now())}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2 mt-4">Thuộc Tính</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        {Object.entries(statEntries).map(([key, value]) => (
          <div key={key}><strong>{key}:</strong> {value}</div>
        ))}
         {Object.entries(permanentBonusStats).map(([key, value]) => (
            value && value > 0 ? <div key={key} className="text-lime-300"><strong>{key}:</strong> +{formatNumber(value)}</div> : null
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2 mt-6">Trang Bị</h2>
      <div className="grid grid-cols-4 gap-2">
        {Object.keys(EQUIPMENT_SLOT_NAMES).map((slotKey) => {
          const slot = slotKey as EquipmentSlot;
          const item = player.equipment[slot];
          const slotName = EQUIPMENT_SLOT_NAMES[slot];
          
          const slotStyle = item ? { borderColor: item.rarity.borderColorValue, borderWidth: '2px', borderStyle: 'solid' } : { borderColor: '#4a4a4a', borderWidth: '2px', borderStyle: 'dashed' };

          return (
            <div 
              key={slot} 
              className={`h-[60px] text-center flex items-center justify-center rounded-md bg-[rgba(0,0,0,0.2)] text-xs p-1 overflow-hidden transition-all duration-150 ease-in-out hover:bg-[rgba(0,0,0,0.3)] ${item ? item.rarity.bgColorClass : ''}`}
              style={slotStyle}
              title={item ? `${item.name}${item.refineLevel > 0 ? ` +${item.refineLevel}` : ''}\n${item.description || ''}` : slotName}
            >
              {item ? (
                <div className={`truncate ${item.rarity.colorClass} ${item.rarity.animationClass || ''}`}>
                  {item.name}
                  {item.refineLevel > 0 && ` +${item.refineLevel}`}
                </div>
              ) : (
                <span className="text-gray-500">{slotName}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Export/Import buttons removed from here */}
    </div>
  );
};

export default CharacterTab;