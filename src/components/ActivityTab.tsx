import React, { useState } from 'react';
import { RARITY_LEVELS, GAME_DATA } from '../constants'; // Assuming GAME_DATA has sects
import { ActivityTabProps, Player } from '../types'; 
import ActionButton from './ActionButton';

interface ActivityCardProps {
  title: string;
  description: string;
  rarityClass: string;
  onClick?: () => void;
  disabled?: boolean;
  usageText?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ title, description, rarityClass, onClick, disabled, usageText }) => {
  return (
    <div 
      className={`bg-[rgba(0,0,0,0.3)] border border-[#4a4a4a] rounded-lg p-4 text-center transition-all duration-200 
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:translate-y-[-4px] hover:shadow-[0_4px_15px_rgba(243,182,58,0.2)]'}`}
      onClick={!disabled ? onClick : undefined}
    >
      <h3 className={`font-bold text-lg ${rarityClass}`}>{title}</h3>
      {usageText && <p className="text-xs text-yellow-400 mt-1">{usageText}</p>}
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
};

const ActivityTab: React.FC<ActivityTabProps> = ({ 
    player, 
    onExplore, 
    onDaoKiepChallenge,
    onSectRaid, // This will be the function to initiate the raid process
    onPvpChallenge,
    onViewLeaderboard,
    getActivityUsage,
    gameData, // For listing sects
    addLog,
    setPlayer // To manage internal state for raid target, or parent can handle
}) => {
  const isDisabledGlobal = player.isBreakingThrough || player.status === 'meditating' || player.status === 'exploring' || player.status === 'fightingBoss';
  const maxUsages = 10; 
  const [raidTargetSelection, setRaidTargetSelection] = useState<string | null>(null); // null, 'selecting', or sectId
  const [showSectListForRaid, setShowSectListForRaid] = useState(false);


  const handleInitiateSectRaid = () => {
    if (isDisabledGlobal || getActivityUsage('sectRaid') >= maxUsages) {
         addLog("Không thể cướp bóc lúc này hoặc đã hết lượt.", "text-yellow-400");
        return;
    }
    setShowSectListForRaid(true);
  };

  const handleConfirmSectRaid = (targetSectId: string) => {
    setShowSectListForRaid(false);
    // The actual raid logic is in App.tsx's onSectRaid, now just passing targetSectId
    if(onSectRaid && typeof (onSectRaid as any) === 'function'){ // Type guard
        (onSectRaid as (targetSectId: string) => void)(targetSectId);
    }
  };


  const activities = [
    { id: 'thamHiemhell', title: "Thám Hiểm Địa Ngục", desc: "Nguy hiểm rình rập, yêu thú hung hãn, phần thưởng cao. Thất bại tổn thất 20% tu vi.", rarity: RARITY_LEVELS.MYTHIC, action: () => onExplore('hell') },
    { id: 'thamHiemgod', title: "Thám Hiểm Thần Vực", desc: "Cấm địa của các vị thần, kẻ yếu vào là chết. Thất bại tổn thất 50% tu vi.", rarity: RARITY_LEVELS.ANCIENT, action: () => onExplore('god') },
    { id: 'thamHiemsecret', title: "Tiến Vào Bí Cảnh", desc: "Một vết nứt không gian kỳ bí. Cơ duyên hay hiểm nguy?", rarity: RARITY_LEVELS.DIVINE, action: () => onExplore('secret') },
    { id: 'daoKiepChallenge', title: "Khiêu Chiến Đạo Kiếp", desc: "Đối mặt thiên kiếp, đột phá giới hạn bản thân. Cơ hội nhận tiên duyên!", rarity: RARITY_LEVELS.LEGENDARY, action: onDaoKiepChallenge },
    { id: 'sectRaid', title: "Cướp Bóc Tông Môn", desc: "Tấn công các tông môn khác để đoạt tài nguyên và danh tiếng.", rarity: RARITY_LEVELS.EPIC, action: handleInitiateSectRaid }, // Changed to initiate selection
    { id: 'pvpChallenge', title: "Khiêu Chiến Tu Sĩ", desc: "Tỷ thí với các tu sĩ khác để tranh giành bảo vật và kinh nghiệm.", rarity: RARITY_LEVELS.EPIC, action: onPvpChallenge },
    { id: 'viewLeaderboard', title: "Bảng Xếp Hạng", desc: "Xem thứ hạng Lực Chiến của bạn và các cường giả khác trong toàn cõi.", rarity: RARITY_LEVELS.RARE, action: onViewLeaderboard },
  ];

  const raidableSects = Object.values(gameData.sects).filter(sect => sect.id !== player.sect);

  if (showSectListForRaid) {
    return (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Chọn Tông Môn Để Cướp Bóc:</h3>
            {raidableSects.length === 0 && <p className="text-gray-400">Không có tông môn nào khác để cướp.</p>}
            <div className="space-y-2">
                {raidableSects.map(sect => (
                    <ActionButton key={sect.id} onClick={() => handleConfirmSectRaid(sect.id)}>
                        Cướp {sect.name}
                    </ActionButton>
                ))}
            </div>
            <ActionButton onClick={() => setShowSectListForRaid(false)} className="mt-4 !bg-gray-600 hover:!bg-gray-500">
                Hủy Bỏ
            </ActionButton>
        </div>
    );
  }


  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map(activity => {
          const usageCount = getActivityUsage(activity.id);
          const usageText = activity.id !== 'thamHiemsecret' && activity.id !== 'viewLeaderboard' ? `(${usageCount}/${maxUsages} Lần)` : undefined;
          const isActivityDisabled = isDisabledGlobal || (usageCount >= maxUsages && activity.id !== 'thamHiemsecret' && activity.id !== 'viewLeaderboard');
          
          return (
            <ActivityCard 
              key={activity.id}
              title={activity.title}
              description={activity.desc}
              rarityClass={activity.rarity.colorClass}
              onClick={activity.action}
              disabled={isActivityDisabled}
              usageText={usageText}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTab;