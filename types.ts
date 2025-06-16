
export interface Rarity {
  name: string;
  colorClass: string;
  borderColorClass: string;
  borderColorValue: string;
  bgColorClass?: string;
  weight: number;
  animationClass?: string;
}

export interface BaseStats { 
  permanentAtk?: number;
  permanentDef?: number;
  permanentHp?: number;
  luck?: number; 
  tuviRatePercent?: number; 
  critChance?: number;
  critDamage?: number;
  dodgeChance?: number;
  accuracy?: number;
  linhThachFindPercent?: number;
  explorationEventChance?: number;
  negativeEffectResist?: number;
}

export interface ItemBonus extends BaseStats {
  attack?: number; 
  defense?: number; 
  hp?: number; 
  lifeSteal?: number;
  damageReduction?: number;
  allStatsPercent?: number;
  attackPercent?: number;
  defensePercent?: number;
  hpPercent?: number;
}

export type ItemType = 'material' | 'equipment' | 'consumable' | 'congPhap' | 'talisman' | 'pill' | 'offlineTicket';

export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  slot?: EquipmentSlot;
  bonus?: ItemBonus;
  effect?: (player: Player, addLogFn: (message: string, colorClass?: string) => void, addItemFn: (item: BaseItem, amount?: number) => void) => string;
  duration?: number; 
  description?: string;
  icon?: string; 
}

export interface InventoryItem extends BaseItem {
  instanceId: string;
  refineLevel: number;
}

export type EquipmentSlot = 'weapon' | 'armor' | 'necklace' | 'ring' | 'pet' | 'helmet' | 'pants' | 'boots' | 'gloves' | 'bracer' | 'belt' | 'cape';

export interface PlayerEquipment {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  necklace: InventoryItem | null;
  ring: InventoryItem | null;
  pet: InventoryItem | null;
  helmet: InventoryItem | null;
  pants: InventoryItem | null;
  boots: InventoryItem | null;
  gloves: InventoryItem | null;
  bracer: InventoryItem | null;
  belt: InventoryItem | null;
  cape: InventoryItem | null;
}

export interface PlayerStats extends ItemBonus { 
  tuviBase: number; 
  level?: number; // For boss stats, player's level is in Player object
}


export interface LevelData {
  globalIndex: number;
  name: string; 
  majorRealmName: string; 
  subTierName: string; 
  tuviMax: number;
  stats: PlayerStats; 
  breakthroughChance?: number;
  mapId: string;
}

export interface Quest {
  id: string;
  desc: string;
  target: number;
  key: keyof QuestProgressData;
  reward: {
    linhThach?: number;
    item?: BaseItem;
    amount?: number;
  };
}

export interface PlayerQuest extends Quest {
  progress: number;
}

export interface QuestProgressData {
  gachaCount: number;
  exploreCount: number;
  refineCount: number;
  breakthroughCount: number; 
  specialEventsFound: number;
  monstersKilled: number;
  bossesKilled: number; // New quest key
  [key: string]: number;
}

export interface MapData {
    id: string;
    name: string;
    minLevelIndex: number; 
    tuViYieldModifier: (playerLevelIndex: number, playerTotalStats: PlayerStats, globalOverrides: GlobalConfigOverrides) => number;
    description: string;
}

export interface PlayerActivityUsage {
    [activityId: string]: { // e.g., 'thamHiemNormal', 'bossChallenge_fireDragon', 'bossWin_fireDragon'
        count: number;
        lastResetDate: string; 
    };
}

export interface SectMembershipInfo {
    title: string;
    styleClass: string;
}

export interface ActiveBuff {
    id: string; 
    sourceItemId: string; 
    name: string;
    icon?: string;
    effect: ItemBonus;
    expiresAt: number; 
}

export interface Player {
  characterName: string;
  isEditingName?: boolean;
  level: number; 
  tuvi: number;
  linhThach: number;
  hp: number;
  baseStats: BaseStats; 
  totalStats: PlayerStats; 
  inventory: Record<string, InventoryItem>;
  status: 'normal' | 'meditating' | 'exploring' | 'fightingBoss'; // Added fightingBoss
  congPhap: InventoryItem[];
  equipment: PlayerEquipment;
  sect: string | null; 
  playerSectTitle: SectMembershipInfo | null; 
  questData: QuestProgressData;
  activeQuests: PlayerQuest[];
  activeBuffs: ActiveBuff[];
  isBreakingThrough: boolean;
  currentMapId: string;
  combatPower: number;
  promoCodesUsed: string[];
  offlineCultivationActiveUntil: number | null;
  lastOnlineTimestamp: number;
  activityUsage: PlayerActivityUsage;
  lastAnnouncementTimestamp?: number; 
}

export interface SectData {
  id: string; 
  name: string;
  bonus: ItemBonus;
  desc: string;
  titleFormat: string; 
  titleStyleClass: string; 
}

export interface TalismanRecipe {
  id: string; 
  name: string; 
  talismanItemId: string; 
  desc: string;
  rarity: Rarity;
  materials: Record<string, number>; 
}

export interface BossRewardItemDrop {
    itemId: string;
    minAmount: number;
    maxAmount: number;
    chance: number; // 0 to 1
}
export interface BossData {
    id: string;
    name: string;
    description: string;
    levelRequirement: number; // Global player level
    stats: PlayerStats; // Uses PlayerStats for structure, level field can be specific boss level
    rarity: Rarity;
    rewards: {
        linhThachMin: number;
        linhThachMax: number;
        itemDrops: BossRewardItemDrop[];
        tuViGain?: number;
    };
    dailyAttemptLimit?: number;
}

export interface GameData {
  levels: LevelData[];
  sects: Record<string, SectData>;
  quests: Quest[];
  talismanRecipes: TalismanRecipe[];
  maps: MapData[];
  baseRealmDefinitions: BaseRealmDefinition[]; 
  bosses: Record<string, BossData>; // New for boss data
}

export interface LogEntry {
  id: string;
  message: string;
  colorClass: string;
  timestamp: string;
}

export interface GachaRollItem extends InventoryItem {
}

export type InventoryFilterRarity = 'all' | Rarity['name'];
export type InventoryFilterType = 'all' | ItemType;

export interface ActivityTabProps {
  player: Player;
  onExplore: (mode: 'normal' | 'hell' | 'god' | 'secret') => void;
  onDaoKiepChallenge: () => void;
  onSectRaid: () => void;
  onPvpChallenge: () => void;
  onViewLeaderboard: () => void;
  getActivityUsage: (activityId: string) => number;
  gameData: GameData; // To list sects for raiding
  addLog: (message: string, colorClass?: string) => void; // For raid target selection
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>; // For sect raid internal state management
}

export interface BossBattleTabProps {
    player: Player;
    gameData: GameData;
    onChallengeBoss: (bossId: string) => void;
    getActivityUsage: (activityId: string) => number;
}


export interface UserCredentials {
    [username: string]: string; 
}

export interface AdminPanelProps {
    isAdmin: boolean;
    getAllUsernames: () => string[];
    loadPlayerDataForAdmin: (username: string) => Player | null;
    savePlayerDataForAdmin: (username: string, playerData: Player) => void;
    addLog: (message: string, colorClass?: string) => void;
    itemDB: Record<string, BaseItem>; 
    gameData: GameData; 
    onSetGlobalAnnouncement: (message: string) => void;
}

export interface SubTierDefinition {
    name: string; 
    tuviMaxMultiplier: number; 
    statMultiplier: number; 
    breakthroughChance?: number;
}

export interface BaseRealmDefinition {
    majorRealmName: string;
    mapId: string;
    baseTuviMax: number; 
    baseStats: PlayerStats; 
    subTiers: SubTierDefinition[] | number; 
    breakthroughChanceToNextRealm?: number;
}

export interface GlobalConfigOverrides {
  GLOBAL_TUVI_RATE_MULTIPLIER?: number;
  GACHA_COST_MULTIPLIER?: number;
  EXPLORATION_LT_GAIN_MULTIPLIER?: number;
  BOSS_REWARD_MULTIPLIER?: number; // Example new override
}

export interface SuperAdminPanelProps {
    isSuperAdmin: boolean;
    currentOverrides: GlobalConfigOverrides;
    onSaveOverrides: (newOverrides: GlobalConfigOverrides) => void;
    onResetOverrides: () => void;
    onSetGlobalAnnouncement: (message: string) => void;
    addLog: (message: string, colorClass?: string) => void;
    onResetAllPlayerActivityUsage: () => void; // New prop
}
