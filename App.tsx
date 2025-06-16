
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, LogEntry, InventoryItem, GachaRollItem, BaseItem, QuestProgressData, PlayerStats, InventoryFilterRarity, InventoryFilterType, ItemType, Rarity, ActivityTabProps, EquipmentSlot, UserCredentials, AdminPanelProps, SectMembershipInfo, BaseStats, GlobalConfigOverrides, SuperAdminPanelProps, ActiveBuff, BossData, BossBattleTabProps } from './types';
import { GAME_DATA, ITEM_DB, RARITY_LEVELS, INITIAL_PLAYER_EQUIPMENT, ALL_RARITIES_ORDERED, MAP_DATA, ITEM_TYPES_FOR_FILTER, ITEM_TYPE_TRANSLATIONS, EQUIPMENT_SLOT_NAMES, initialGlobalConfigOverrides } from './constants';
import { formatNumber } from './utils/formatters';
import { calculateTotalStats, generateNewInstanceId, createInventoryItemFromBase, countItemInInventory, removeItemsFromInventory, createInventoryItem } from './utils/playerUtils';
import Panel from './components/Panel';
import ActionButton from './components/ActionButton';
import TabButton from './components/TabButton';
import CharacterTab from './components/CharacterTab';
import CongPhapTab from './components/CongPhapTab';
import CraftingTab from './components/CraftingTab';
import ActivityTab from './components/ActivityTab';
import GachaModal from './components/GachaModal';
import ItemDisplay from './components/ItemDisplay';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import GlobalMarquee from './components/GlobalMarquee';
import BossBattleTab from './components/BossBattleTab';

// Supabase imports
import { supabase } from './supabase'; // New Supabase client
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';


interface ExplorationEvent {
    description: string;
    monster?: boolean;
    levelModifier?: number;
    dropIds?: string[];
    result?: (p: Player, addItem: (itemData: BaseItem, amount?: number) => void, addLogFn: (message: string, colorClass?: string) => void) => string;
    logColor?: string;
    amount?: number;
    amountPerDrop?: number[];
    choices?: { text: string, outcome: (p: Player, addItem: (itemData: BaseItem, amount?: number) => void, addLogFn: (message: string, colorClass?: string) => void) => string }[];
    requiresLuck?: number;
    rarity?: Rarity;
}


const calculateCombatPower = (stats: PlayerStats): number => {
    let power = 0;
    power += (stats.hp || 0) / 5;
    power += (stats.attack || 0) * 2;
    power += (stats.defense || 0) * 3;
    power += (stats.critChance || 0) * 2000;
    power += (stats.critDamage || 0) * 1000;
    power += (stats.lifeSteal || 0) * 1500;
    power += (stats.damageReduction || 0) * 1800;
    power += (stats.dodgeChance || 0) * 1600;
    power += (stats.accuracy || 0) * 1400;
    power += (stats.luck || 0) * 500;
    power += (stats.explorationEventChance || 0) * 1000;
    power += (stats.negativeEffectResist || 0) * 800;
    return Math.floor(power);
};

// LocalStorage keys for non-player-specific data (can be kept or migrated)
const LS_GLOBAL_CONFIG_OVERRIDES_KEY = 'tu_tien_global_config_overrides';
const LS_GLOBAL_ANNOUNCEMENT_KEY = 'tu_tien_global_announcement';


const App: React.FC = () => {
    const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

    const [authError, setAuthError] = useState<string>('');
    const [activeGlobalConfig, setActiveGlobalConfig] = useState<GlobalConfigOverrides>(initialGlobalConfigOverrides);
    const [globalAnnouncement, setGlobalAnnouncement] = useState<{ message: string; timestamp: number } | null>(null);
    const [showMarquee, setShowMarquee] = useState(false);

    const initialCharacterName = "Vô Danh Giả";
    const initialLevelData = GAME_DATA.levels[0];
    const initialPlayerBaseStats: BaseStats = { permanentAtk: 0, permanentDef: 0, permanentHp: 0, luck: 0.01, tuviRatePercent: 0, critChance: 0.01, critDamage: 1.5 };

    const initialTotalStats: PlayerStats = {
        ...initialLevelData.stats,
        ...initialPlayerBaseStats,
        tuviBase: initialLevelData.stats.tuviBase as number,
        hp: initialLevelData.stats.hp || 0,
        attack: initialLevelData.stats.attack || 0,
        defense: initialLevelData.stats.defense || 0,
        critChance: initialLevelData.stats.critChance ?? initialPlayerBaseStats.critChance ?? 0.01,
        critDamage: initialLevelData.stats.critDamage ?? initialPlayerBaseStats.critDamage ?? 1.5,
    };

    const initialMapId = GAME_DATA.levels[0].mapId;
    const initialQuestData: QuestProgressData = {
        gachaCount: 0, exploreCount: 0, refineCount: 0, breakthroughCount: 0, specialEventsFound: 0, monstersKilled: 0, bossesKilled: 0,
    };

    const getDefaultPlayerState = (charName: string): Player => ({
        characterName: charName, level: 0,
        tuvi: 0, linhThach: 2000,
        hp: initialLevelData.stats.hp || 0,
        baseStats: { ...initialPlayerBaseStats },
        totalStats: { ...initialTotalStats },
        inventory: {}, status: 'normal', congPhap: [],
        equipment: { ...INITIAL_PLAYER_EQUIPMENT }, sect: null, playerSectTitle: null,
        questData: {...initialQuestData},
        activeQuests: GAME_DATA.quests.slice(0, 5).map(q => {
            const progress = q.key === 'breakthroughCount' ? 0 : (initialQuestData[q.key as keyof QuestProgressData] || 0);
            return { ...q, progress };
        }),
        activeBuffs: [],
        isBreakingThrough: false,
        currentMapId: initialMapId,
        combatPower: calculateCombatPower(initialTotalStats),
        promoCodesUsed: [], offlineCultivationActiveUntil: null, lastOnlineTimestamp: Date.now(),
        activityUsage: {},
        lastAnnouncementTimestamp: 0,
    });

    const [gameLog, setGameLog] = useState<LogEntry[]>([]);
    const [activeMainTab, setActiveMainTab] = useState<'char' | 'congPhap' | 'craft' | 'activity' | 'boss' | 'admin' | 'superAdmin'>('char');
    const [activeShopTab, setActiveShopTab] = useState<'gacha' | 'sect' | 'special'>('gacha');

    const [isGachaModalOpen, setIsGachaModalOpen] = useState(false);
    const [lastGachaRoll, setLastGachaRoll] = useState<GachaRollItem[]>([]);

    const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([]);
    const [inventoryFilterRarity, setInventoryFilterRarity] = useState<InventoryFilterRarity>('all');
    const [inventoryFilterType, setInventoryFilterType] = useState<InventoryFilterType>('all');
    const [promoCodeInput, setPromoCodeInput] = useState('');

    const addLog = useCallback((message: string, colorClass: string = 'text-gray-300') => {
        setGameLog(prevLog => {
            const newEntry: LogEntry = {
                id: generateNewInstanceId(),
                message: `[${new Date().toLocaleTimeString()}] ${message}`,
                colorClass, timestamp: new Date().toISOString(),
            };
            return [newEntry, ...prevLog].slice(0, 200);
        });
    }, []);

     useEffect(() => {
        const storedOverrides = localStorage.getItem(LS_GLOBAL_CONFIG_OVERRIDES_KEY);
        if (storedOverrides) {
            try {
                setActiveGlobalConfig({ ...initialGlobalConfigOverrides, ...JSON.parse(storedOverrides) });
            } catch (e) { console.error("Error parsing global config overrides:", e); }
        }
        const storedAnnouncement = localStorage.getItem(LS_GLOBAL_ANNOUNCEMENT_KEY);
        if (storedAnnouncement) {
            try {
                setGlobalAnnouncement(JSON.parse(storedAnnouncement));
            } catch (e) { console.error("Error parsing global announcement:", e); }
        }
    }, []);

    const loadOrCreatePlayerFromSupabase = useCallback(async (user: SupabaseUser, defaultNameFromAuth: string) => {
        try {
            const { data: playerData, error } = await supabase
                .from('players') // Your Supabase table name
                .select('data') // Assuming player object is in 'data' JSONB column
                .eq('id', user.id) // 'id' should match the user's auth ID
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116: "Query returned 0 rows" which is fine for new user
                throw error;
            }

            let loadedPlayer: Player;

            if (playerData && playerData.data) {
                const supabaseData = playerData.data as Partial<Player>;
                const defaultState = getDefaultPlayerState(supabaseData.characterName || defaultNameFromAuth);
                const validLevel = Math.max(0, Math.min(supabaseData.level || 0, GAME_DATA.levels.length - 1));
                const currentLevelDataForLoad = GAME_DATA.levels[validLevel];

                loadedPlayer = {
                    ...defaultState,
                    ...supabaseData,
                    characterName: supabaseData.characterName || defaultState.characterName,
                    level: validLevel,
                    baseStats: { ...defaultState.baseStats, ...supabaseData.baseStats },
                    currentMapId: supabaseData.currentMapId || currentLevelDataForLoad.mapId,
                    activityUsage: supabaseData.activityUsage || {},
                    lastAnnouncementTimestamp: supabaseData.lastAnnouncementTimestamp || 0,
                    activeBuffs: supabaseData.activeBuffs || [],
                };
                 if (loadedPlayer.sect && GAME_DATA.sects[loadedPlayer.sect]) {
                    const sectData = GAME_DATA.sects[loadedPlayer.sect];
                    loadedPlayer.playerSectTitle = {
                        title: sectData.titleFormat.replace('{name}', loadedPlayer.characterName).replace('{sectName}', sectData.name),
                        styleClass: sectData.titleStyleClass
                    };
                } else {
                    loadedPlayer.playerSectTitle = null;
                }

                const todayDateString = new Date().toISOString().split('T')[0];
                const updatedActivityUsage = { ...loadedPlayer.activityUsage };
                Object.keys(updatedActivityUsage).forEach(activityId => {
                    if (updatedActivityUsage[activityId] && updatedActivityUsage[activityId].lastResetDate !== todayDateString) {
                        updatedActivityUsage[activityId] = { count: 0, lastResetDate: todayDateString };
                    }
                });
                loadedPlayer.activityUsage = updatedActivityUsage;

                addLog(`Chào mừng đạo hữu ${loadedPlayer.characterName} (Email: ${user.email}) quay trở lại.`, 'text-yellow-400');
            } else {
                let charName = prompt(`Chào mừng ${defaultNameFromAuth}! Hãy đặt tên cho nhân vật của bạn:`, initialCharacterName);
                if (!charName || charName.trim() === "") charName = initialCharacterName;
                loadedPlayer = getDefaultPlayerState(charName);
                const { error: insertError } = await supabase
                    .from('players')
                    .upsert({ id: user.id, data: loadedPlayer }); // Use upsert for safety
                if (insertError) throw insertError;
                addLog(`Tài khoản mới được tạo cho ${defaultNameFromAuth}. Chào mừng ${charName}!`, 'text-green-500');
            }

            if (loadedPlayer.offlineCultivationActiveUntil && Date.now() < loadedPlayer.offlineCultivationActiveUntil) {
                const timeSinceLastOnline = Date.now() - (loadedPlayer.lastOnlineTimestamp || Date.now());
                if (timeSinceLastOnline > 60000) {
                    const currentLevelDataForOffline = GAME_DATA.levels[loadedPlayer.level];
                    const statsForOfflineCalc = calculateTotalStats(loadedPlayer);
                    const baseOnlineRate = (currentLevelDataForOffline.stats.tuviBase as number) * (1 + (statsForOfflineCalc.tuviRatePercent || 0));
                    const offlineGainRate = baseOnlineRate / 3 * (activeGlobalConfig.GLOBAL_TUVI_RATE_MULTIPLIER || 1);
                    let tuViGainedOffline = Math.floor((timeSinceLastOnline / 1000) * offlineGainRate);

                    if (tuViGainedOffline > 0) {
                        loadedPlayer.tuvi = Math.min(loadedPlayer.tuvi + tuViGainedOffline, currentLevelDataForOffline.tuviMax === Infinity ? Infinity : currentLevelDataForOffline.tuviMax);
                        addLog(`Sau khi rời Vô Hạn Thời Không, bạn nhận được ${formatNumber(tuViGainedOffline)} Tu Vi.`, RARITY_LEVELS.EPIC.colorClass);
                    }
                }
            }
            loadedPlayer.lastOnlineTimestamp = Date.now();

            const finalStats = calculateTotalStats(loadedPlayer);
            setPlayer({
                ...loadedPlayer,
                totalStats: finalStats,
                hp: finalStats.hp || 0,
                combatPower: calculateCombatPower(finalStats)
            });

            if (globalAnnouncement && (!loadedPlayer.lastAnnouncementTimestamp || globalAnnouncement.timestamp > loadedPlayer.lastAnnouncementTimestamp)) {
                setShowMarquee(true);
            }

        } catch (err: any) {
            console.error("Error loading/creating player data from Supabase:", err);
            addLog(`Lỗi tải dữ liệu người chơi từ server Supabase: ${err.message}. Vui lòng thử lại.`, "text-red-500");
            setPlayer(null);
        }
    }, [addLog, activeGlobalConfig, globalAnnouncement, initialCharacterName]);

    useEffect(() => {
        setIsLoadingUser(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSupabaseSession(session);
            setSupabaseUser(session?.user ?? null);
            setIsLoadingUser(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSupabaseSession(session);
            const currentUser = session?.user ?? null;
            setSupabaseUser(currentUser);

            if (currentUser) {
                const localAdminUser = localStorage.getItem('tu_tien_last_user');
                 if (localAdminUser === 'luuvanadmin' && currentUser.email?.startsWith('admin')) {
                    setIsAdmin(true); setIsSuperAdmin(false); setPlayer(null);
                    addLog("Đăng nhập Admin cục bộ được ghi đè bởi Supabase user admin.", "text-orange-400");
                } else if (localAdminUser === 'superadmin' && currentUser.email?.startsWith('superadmin')) {
                    setIsSuperAdmin(true); setIsAdmin(false); setPlayer(null);
                    addLog("Đăng nhập SuperAdmin cục bộ được ghi đè bởi Supabase user superadmin.", "text-red-500");
                } else {
                    setIsAdmin(false); setIsSuperAdmin(false);
                    await loadOrCreatePlayerFromSupabase(currentUser, currentUser.email || initialCharacterName);
                }
            } else {
                setPlayer(null);
                setIsAdmin(false);
                setIsSuperAdmin(false);
                addLog("Người dùng đã đăng xuất.", "text-gray-400");
            }
            if (_event !== 'INITIAL_SESSION') setIsLoadingUser(false);
             setGameLog([]);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [addLog, loadOrCreatePlayerFromSupabase, initialCharacterName]);

    const savePlayerData = useCallback(async () => {
        if (supabaseUser && player && !isAdmin && !isSuperAdmin) {
            try {
                 const { error: updateError } = await supabase
                    .from('players')
                    .update({ data: player }) // Store the whole player object in 'data'
                    .eq('id', supabaseUser.id);
                if (updateError) throw updateError;
                // console.log("Player data saved to Supabase for UID:", supabaseUser.id);
            } catch (err: any) {
                console.error("Error saving player data to Supabase:", err);
                addLog(`Lỗi lưu dữ liệu lên server Supabase: ${err.message}!`, "text-red-500");
            }
        }
    }, [supabaseUser, player, isAdmin, isSuperAdmin, addLog]);


    const handleRegister = useCallback(async (email: string, pass: string): Promise<boolean> => {
        setAuthError('');
        try {
            const { error } = await supabase.auth.signUp({ email, password: pass });
            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error("Supabase registration error:", err);
            setAuthError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            return false;
        }
    }, []);

    const handleLogin = useCallback(async (email: string, pass: string): Promise<boolean> => {
        setAuthError('');
        if (email === 'luuvanadmin@local.dev' && pass === 'Vinhloc123@') {
            setIsAdmin(true); setIsSuperAdmin(false); setPlayer(null); setSupabaseUser(null); setSupabaseSession(null);
            localStorage.setItem('tu_tien_last_user', 'luuvanadmin');
            addLog("Đăng nhập Admin cục bộ thành công.", "text-red-500");
            return true;
        }
        if (email === 'superadmin@local.dev' && pass === 'Vinhloc123@') {
            setIsSuperAdmin(true); setIsAdmin(false); setPlayer(null); setSupabaseUser(null); setSupabaseSession(null);
            localStorage.setItem('tu_tien_last_user', 'superadmin');
            addLog("Đăng nhập Super Admin cục bộ thành công.", "text-orange-500");
            return true;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error("Supabase login error:", err);
            setAuthError(err.message || 'Đăng nhập thất bại. Email hoặc mật khẩu không đúng.');
            return false;
        }
    }, [addLog]);

    const handleLogout = useCallback(async () => {
        if (player && !isAdmin && !isSuperAdmin) await savePlayerData();

        if (isAdmin || isSuperAdmin) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setPlayer(null);
            localStorage.removeItem('tu_tien_last_user');
            addLog(isAdmin ? "Admin đã đăng xuất." : "Super Admin đã đăng xuất.", "text-gray-400");
        } else {
            const { error } = await supabase.auth.signOut();
            if (error) {
                 console.error("Supabase logout error:", error);
                 addLog(`Lỗi đăng xuất Supabase: ${error.message}.`, "text-red-500");
            }
        }
    }, [player, isAdmin, isSuperAdmin, savePlayerData, addLog]);

    useEffect(() => {
        const saveInterval = setInterval(() => { if (supabaseUser && player && !isAdmin && !isSuperAdmin) savePlayerData(); }, 30000);
        return () => clearInterval(saveInterval);
    }, [supabaseUser, player, isAdmin, isSuperAdmin, savePlayerData]);

    useEffect(() => {
         const handleVisibilityChange = () => { if (document.visibilityState === 'hidden' && supabaseUser && player && !isAdmin && !isSuperAdmin) savePlayerData(); };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [supabaseUser, player, isAdmin, isSuperAdmin, savePlayerData]);

    const addItemToInventory = useCallback((itemData: BaseItem, amount: number = 1): string[] => {
        const newInstanceIds: string[] = [];
        setPlayer(prev => {
            if (!prev) return null;
            const newInventory = { ...prev.inventory };
            for (let i = 0; i < amount; i++) {
                const newItem = createInventoryItemFromBase(itemData);
                newInventory[newItem.instanceId] = newItem;
                newInstanceIds.push(newItem.instanceId);
            }
            return { ...prev, inventory: newInventory };
        });
        return newInstanceIds;
    }, [setPlayer]);

    useEffect(() => {
      if (!player) return;
        setPlayer(prev => {
            if (!prev) return null;
            const newTotalStats = calculateTotalStats(prev);
            let newHp = prev.hp;
            if (newTotalStats.hp && (newHp <= 0 || newHp > newTotalStats.hp || !Number.isFinite(newHp))) {
                 newHp = newTotalStats.hp;
            } else if (!newTotalStats.hp && newHp <=0) { newHp = 1; }
            return { ...prev, totalStats: newTotalStats, hp: newHp, combatPower: calculateCombatPower(newTotalStats) };
        });
    }, [player?.level, player?.equipment, player?.congPhap, player?.sect, player?.baseStats, player?.activeBuffs, activeGlobalConfig, setPlayer]);

    const trackQuestProgress = useCallback((key: keyof QuestProgressData, amount: number) => {
        setPlayer(prev => {
            if (!prev) return null;
            const currentProgressForKey = prev.questData[key] || 0;
            const newQuestDataValue = key === 'breakthroughCount' ? prev.level : currentProgressForKey + amount;
            const newQuestData = { ...prev.questData, [key]: newQuestDataValue };
            const newActiveQuests = prev.activeQuests.map(q => q.key === key ? { ...q, progress: newQuestDataValue } : q);
            return { ...prev, questData: newQuestData, activeQuests: newActiveQuests };
        });
    }, [setPlayer]);

    useEffect(() => {
        if (!supabaseUser || !player || isAdmin || isSuperAdmin || player.isBreakingThrough || player.status !== 'normal') return;
        const gameTick = setInterval(() => {
            setPlayer(prevPlayer => {
                if (!prevPlayer || prevPlayer.isBreakingThrough || prevPlayer.status !== 'normal') return prevPlayer;
                let newPlayerState = { ...prevPlayer };
                const currentLevelData = GAME_DATA.levels[newPlayerState.level];
                const currentMap = MAP_DATA.find(m => m.id === newPlayerState.currentMapId) || MAP_DATA[0];

                let tuviGainRate = (currentLevelData.stats.tuviBase as number) * (1 + (newPlayerState.totalStats.tuviRatePercent || 0));
                tuviGainRate *= currentMap.tuViYieldModifier(newPlayerState.level, newPlayerState.totalStats, activeGlobalConfig);

                let tuviGain = tuviGainRate;
                if (Math.random() < 0.2 * (1 + (newPlayerState.totalStats.luck || 0) * 0.5)) {
                    const burstMultiplier = 2 + Math.random() * 8; tuviGain *= burstMultiplier;
                    if (burstMultiplier > 5) addLog(`Bạo kích tu vi +${formatNumber(tuviGain)} tại ${currentMap.name}!!`, 'text-orange-400');
                }
                newPlayerState.tuvi = Math.min(newPlayerState.tuvi + tuviGain, currentLevelData.tuviMax === Infinity ? Infinity : currentLevelData.tuviMax);

                const now = Date.now();
                const activeBuffsStillActive = newPlayerState.activeBuffs.filter(buff => {
                    if (buff.expiresAt <= now) {
                        addLog(`Hiệu ứng [${buff.name}] đã hết hạn.`, 'text-gray-400');
                        return false;
                    }
                    return true;
                });
                if (activeBuffsStillActive.length !== newPlayerState.activeBuffs.length) {
                    newPlayerState.activeBuffs = activeBuffsStillActive;
                }

                if (newPlayerState.tuvi >= currentLevelData.tuviMax && newPlayerState.level < GAME_DATA.levels.length - 1) {
                    newPlayerState.isBreakingThrough = true;
                    addLog(`Tu vi viên mãn tại ${currentMap.name} (${currentLevelData.majorRealmName} - ${currentLevelData.subTierName}), tự động đột phá lên [${GAME_DATA.levels[newPlayerState.level + 1].name}]...`, 'text-yellow-400 font-bold');
                    setTimeout(() => {
                        setPlayer(currentPlayerOnTimeout => {
                            if (!currentPlayerOnTimeout) return null;
                            let updatedPlayerOnTimeout = { ...currentPlayerOnTimeout };
                            const oldLevelDataOnTimeout = GAME_DATA.levels[updatedPlayerOnTimeout.level];
                            const nextLevelDataOnTimeout = GAME_DATA.levels[updatedPlayerOnTimeout.level + 1];
                            if (!nextLevelDataOnTimeout) { updatedPlayerOnTimeout.isBreakingThrough = false; return updatedPlayerOnTimeout; }
                            let chance = oldLevelDataOnTimeout.breakthroughChance !== undefined ? oldLevelDataOnTimeout.breakthroughChance : 0.95;
                            chance = Math.min(0.99, Math.max(0.01, chance * (1 + (updatedPlayerOnTimeout.totalStats.luck || 0) * 0.2)));
                            if (Math.random() < chance) {
                                updatedPlayerOnTimeout.level++; updatedPlayerOnTimeout.tuvi = 0;
                                updatedPlayerOnTimeout.currentMapId = nextLevelDataOnTimeout.mapId;
                                const newMapForLevel = MAP_DATA.find(m => m.id === nextLevelDataOnTimeout.mapId) || MAP_DATA[0];
                                addLog(`Đột phá thành công (${(chance*100).toFixed(0)}%)! Tiến vào [${nextLevelDataOnTimeout.name}]! Chuyển đến khu vực: [${newMapForLevel.name}]`, 'text-green-500 font-bold text-lg');
                                trackQuestProgress('breakthroughCount', 1);
                            } else {
                                updatedPlayerOnTimeout.tuvi = Math.floor(updatedPlayerOnTimeout.tuvi * 0.8);
                                updatedPlayerOnTimeout.hp = Math.max(1, Math.floor((updatedPlayerOnTimeout.totalStats.hp || 0) * 0.5));
                                addLog(`Đột phá thất bại (${(chance*100).toFixed(0)}%)! Tâm ma xâm nhập! Tu vi tổn thất, thương thế nghiêm trọng.`, 'text-red-500 font-bold text-lg');
                            }
                            updatedPlayerOnTimeout.isBreakingThrough = false; return updatedPlayerOnTimeout;
                        });
                    }, 3000);
                }
                if (newPlayerState.characterName !== initialCharacterName && supabaseUser) newPlayerState.lastOnlineTimestamp = Date.now();
                return newPlayerState;
            });
        }, 1000);
        return () => clearInterval(gameTick);
    }, [supabaseUser, player, isAdmin, isSuperAdmin, addLog, trackQuestProgress, activeGlobalConfig, setPlayer, initialCharacterName]);

    const getActivityUsage = useCallback((activityId: string): number => {
        if (!player) return 0;
        const todayDateString = new Date().toISOString().split('T')[0];
        const usage = player.activityUsage[activityId];
        if (usage && usage.lastResetDate === todayDateString) return usage.count;
        return 0;
    }, [player]);

    const incrementActivityUsage = useCallback((activityId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            const todayDateString = new Date().toISOString().split('T')[0];
            const currentUsage = prev.activityUsage[activityId];
            let newCount = (currentUsage && currentUsage.lastResetDate === todayDateString) ? currentUsage.count + 1 : 1;
            return { ...prev, activityUsage: { ...prev.activityUsage, [activityId]: { count: newCount, lastResetDate: todayDateString }}};
        });
    }, [setPlayer]);

     const handleCharacterNameChange = useCallback((newName: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            addLog(`Tên nhân vật đã được đổi thành: ${newName}`, RARITY_LEVELS.EPIC.colorClass);
            let updatedPlayerSectTitle = prev.playerSectTitle;
            if (prev.sect && GAME_DATA.sects[prev.sect]) {
                const sectData = GAME_DATA.sects[prev.sect];
                 updatedPlayerSectTitle = { title: sectData.titleFormat.replace('{name}', newName).replace('{sectName}', sectData.name), styleClass: sectData.titleStyleClass };
            }
            return { ...prev, characterName: newName, playerSectTitle: updatedPlayerSectTitle };
        });
    }, [setPlayer, addLog]);

    const handleJoinSect = useCallback((sectId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            if (prev.sect) { addLog(`Bạn đã ở trong ${GAME_DATA.sects[prev.sect].name}! Rời tông môn hiện tại trước.`, 'text-yellow-400'); return prev; }
            const sectData = GAME_DATA.sects[sectId];
            if (sectData) {
                const newSectTitle: SectMembershipInfo = { title: sectData.titleFormat.replace('{name}', prev.characterName).replace('{sectName}', sectData.name), styleClass: sectData.titleStyleClass };
                addLog(`Gia nhập [${sectData.name}]! ${sectData.desc}`, 'text-green-500');
                return { ...prev, sect: sectId, playerSectTitle: newSectTitle };
            } return prev;
        });
    }, [setPlayer, addLog]);

    const handleLeaveSect = useCallback(() => {
        setPlayer(prev => {
            if (!prev || !prev.sect) { addLog("Chưa gia nhập tông môn nào.", "text-gray-400"); return prev; }
            const sectData = GAME_DATA.sects[prev.sect];
            if (!sectData) {
                addLog(`Lỗi: Không tìm thấy dữ liệu cho tông môn ID: ${prev.sect}`, 'text-red-500');
                return { ...prev, sect: null, playerSectTitle: null };
            }
            const sectName = sectData.name;
            addLog(`Đã rời [${sectName}].`, "text-orange-400");
            return { ...prev, sect: null, playerSectTitle: null };
        });
    }, [setPlayer, addLog]);

    const handleEquipItem = useCallback((itemInstanceId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            const itemToEquip = prev.inventory[itemInstanceId];
            if (!itemToEquip || itemToEquip.type !== 'equipment' || !itemToEquip.slot) return prev;
            const newEquipment = { ...prev.equipment };
            const newInventory = { ...prev.inventory };
            const currentEquippedItem = newEquipment[itemToEquip.slot];
            if (currentEquippedItem) { newInventory[currentEquippedItem.instanceId] = currentEquippedItem; }
            newEquipment[itemToEquip.slot] = itemToEquip;
            delete newInventory[itemInstanceId];
            addLog(`Đã trang bị [${itemToEquip.name}]`, itemToEquip.rarity.colorClass);
            return { ...prev, equipment: newEquipment, inventory: newInventory };
        });
    }, [setPlayer, addLog]);

    const handleUseItem = useCallback((itemInstanceId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            const itemToUse = prev.inventory[itemInstanceId];
            if (!itemToUse) return prev;

            let playerStateForEffect = { ...prev };
            let logMessage = `Sử dụng [${itemToUse.name}].`;
            let effectConsumedItem = true;
            let newActiveBuffs = [...prev.activeBuffs];

            if (itemToUse.type === 'talisman' && itemToUse.bonus && itemToUse.duration) {
                const newBuff: ActiveBuff = {
                    id: generateNewInstanceId(),
                    sourceItemId: itemToUse.id,
                    name: itemToUse.name,
                    icon: itemToUse.icon,
                    effect: itemToUse.bonus,
                    expiresAt: Date.now() + itemToUse.duration * 1000,
                };
                newActiveBuffs.push(newBuff);
                logMessage = `Đã kích hoạt [${itemToUse.name}]! Hiệu ứng kéo dài ${Math.floor(itemToUse.duration / 60)} phút.`;
                addLog(logMessage, itemToUse.rarity.colorClass);
            } else if (itemToUse.effect && (itemToUse.type === 'consumable' || itemToUse.type === 'pill' || itemToUse.type === 'offlineTicket')) {
                const effectResult = itemToUse.effect(playerStateForEffect, addLog, addItemToInventory);
                logMessage = effectResult || logMessage;
            } else {
                 addLog(`Không thể sử dụng [${itemToUse.name}].`, "text-yellow-400");
                return prev;
            }

            const newInventory = { ...prev.inventory };
            if (effectConsumedItem) delete newInventory[itemInstanceId];

            return {
                ...prev,
                ...playerStateForEffect,
                inventory: newInventory,
                activeBuffs: newActiveBuffs,
                tuvi: playerStateForEffect.tuvi,
                linhThach: playerStateForEffect.linhThach,
                hp: playerStateForEffect.hp,
                baseStats: {...playerStateForEffect.baseStats},
                offlineCultivationActiveUntil: playerStateForEffect.offlineCultivationActiveUntil,
            };
        });
    }, [setPlayer, addLog, addItemToInventory]);

    const handleLearnCongPhap = useCallback((instanceId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            if (prev.congPhap.length >= 5) { addLog("Đã học đủ 5 công pháp!", "text-yellow-400"); return prev; }
            const cpToLearn = prev.inventory[instanceId];
            if (!cpToLearn || cpToLearn.type !== 'congPhap') return prev;
            const newCongPhapList = [...prev.congPhap, cpToLearn];
            const newInventory = { ...prev.inventory };
            delete newInventory[instanceId];
            addLog(`Lĩnh ngộ [${cpToLearn.name}]!`, cpToLearn.rarity.colorClass);
            return { ...prev, congPhap: newCongPhapList, inventory: newInventory };
        });
    }, [setPlayer, addLog]);

    const handleAbandonCongPhap = useCallback((index: number) => {
        setPlayer(prev => {
            if (!prev) return null;
            if (index < 0 || index >= prev.congPhap.length) return prev;
            const abandonedCp = prev.congPhap[index];
            const newCongPhapList = prev.congPhap.filter((_, i) => i !== index);
            const newInventory = { ...prev.inventory };
            newInventory[abandonedCp.instanceId] = abandonedCp;
            addLog(`Hủy bỏ [${abandonedCp.name}].`, "text-gray-400");
            return { ...prev, congPhap: newCongPhapList, inventory: newInventory };
        });
    }, [setPlayer, addLog]);

    const handleRefineItem = useCallback((instanceId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            const itemToRefineInventory = prev.inventory[instanceId]; // Check inventory first
            const itemToRefineEquipment = Object.values(prev.equipment).find(eq => eq?.instanceId === instanceId);
            const itemToRefine = itemToRefineInventory || itemToRefineEquipment;


            if (!itemToRefine || itemToRefine.type !== 'equipment') {
                 addLog("Vật phẩm không hợp lệ hoặc không tìm thấy.", "text-red-400");
                return prev;
            }
            const refineLevel = itemToRefine.refineLevel || 0;
            const cost = (refineLevel + 1) * 1000;
            const materialCost = Math.ceil((refineLevel + 1) / 2);
            const stoneId = 'cuong_hoa_thach';
            const stoneCount = countItemInInventory(prev.inventory, stoneId);
            if (prev.linhThach < cost || stoneCount < materialCost) { addLog("Không đủ nguyên liệu!", "text-red-400"); return prev; }
            let newLinhThach = prev.linhThach - cost;
            let newInventory = removeItemsFromInventory(prev.inventory, stoneId, materialCost);
            const successChance = Math.max(0.1, 1 - (refineLevel * 0.08));

            let refinedItem = { ...itemToRefine }; // Create a mutable copy

            if (Math.random() < successChance) {
                refinedItem.refineLevel = refineLevel + 1;
                addLog(`Cường hóa [${refinedItem.name}] +${refinedItem.refineLevel} thành công!`, 'text-green-400');
            } else {
                addLog(`Cường hóa [${refinedItem.name}] thất bại!`, 'text-red-400');
            }

            // Update item in inventory or equipment
            if (newInventory[instanceId]) { // If it was in inventory
                newInventory[instanceId] = refinedItem;
            } else if (itemToRefine.slot && prev.equipment[itemToRefine.slot as EquipmentSlot]?.instanceId === instanceId) { // If it was equipped
                 const slotKey = itemToRefine.slot as EquipmentSlot;
                 const newEquipment = { ...prev.equipment, [slotKey]: refinedItem };
                 trackQuestProgress('refineCount', 1);
                 return { ...prev, linhThach: newLinhThach, inventory: newInventory, equipment: newEquipment };
            }


            trackQuestProgress('refineCount', 1);
            return { ...prev, linhThach: newLinhThach, inventory: newInventory };
        });
    }, [setPlayer, addLog, trackQuestProgress]);

    const getRandomGachaItem = (): BaseItem => { const totalWeight = ALL_RARITIES_ORDERED.reduce((sum, r) => sum + r.weight, 0); let randomWeight = Math.random() * totalWeight; let chosenRarity: Rarity = RARITY_LEVELS.COMMON; for (const rarity of ALL_RARITIES_ORDERED) { if (randomWeight < rarity.weight) { chosenRarity = rarity; break; } randomWeight -= rarity.weight; } const itemsInRarity = Object.values(ITEM_DB).filter(item => item.rarity.name === chosenRarity.name && item.type !== 'offlineTicket'); if (itemsInRarity.length === 0) { const commonItems = Object.values(ITEM_DB).filter(item => item.rarity.name === RARITY_LEVELS.COMMON.name && item.type !== 'offlineTicket'); return commonItems[Math.floor(Math.random() * commonItems.length)] || ITEM_DB['linh_thao']; } return itemsInRarity[Math.floor(Math.random() * itemsInRarity.length)]; };

    const handleQuayBaoVat = useCallback((times: number) => {
        if (!player) return;
        const costs: Record<number, number> = { 1: 1000, 10: 9000, 50: 42500, 100: 80000 };
        const baseCost = costs[times];
        if (!baseCost) { addLog("Số lần quay không hợp lệ.", "text-red-400"); return; }
        const actualCost = baseCost * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1);
        if (player.linhThach < actualCost) { addLog("Linh thạch không đủ!", "text-red-400"); return; }
        const newItemsRolled: GachaRollItem[] = [];
        let newInventory = { ...player.inventory };
        for (let i = 0; i < times; i++) {
            const randomItemBase = getRandomGachaItem();
            const newItemInstance = createInventoryItemFromBase(randomItemBase);
            newInventory[newItemInstance.instanceId] = newItemInstance;
            newItemsRolled.push(newItemInstance);
        }
        setPlayer(prev => { if (!prev) return null; return { ...prev, linhThach: prev.linhThach - actualCost, inventory: newInventory, } });
        setLastGachaRoll(newItemsRolled);
        setIsGachaModalOpen(true);
        addLog(`Dùng ${formatNumber(actualCost)} LT quay ${times} lần.`, 'text-yellow-400');
        trackQuestProgress('gachaCount', times);
    }, [player, activeGlobalConfig, addLog, setPlayer, setLastGachaRoll, setIsGachaModalOpen, trackQuestProgress, getRandomGachaItem]);

    const handleSellGachaItems = useCallback((instanceIds: string[]) => {
        if (!player) return;
        let soldCount = 0;
        let linhThachGained = 0;
        const newInventory = { ...player.inventory };
        const newLastGachaRoll = lastGachaRoll.filter(item => !instanceIds.includes(item.instanceId));
        instanceIds.forEach(id => {
            const item = player.inventory[id];
            if (item) {
                const rarityIndex = ALL_RARITIES_ORDERED.findIndex(r => r.name === item.rarity.name);
                linhThachGained += (ALL_RARITIES_ORDERED.length - rarityIndex) * 20 * (item.refineLevel + 1);
                delete newInventory[id];
                soldCount++;
            }
        });
        if (soldCount > 0) {
            setPlayer(prev => { if (!prev) return null; return { ...prev, linhThach: prev.linhThach + linhThachGained, inventory: newInventory, } });
            setLastGachaRoll(newLastGachaRoll);
            addLog(`Bán ${soldCount} vật phẩm, nhận ${formatNumber(linhThachGained)} LT.`, 'text-green-400');
        }
        if (newLastGachaRoll.length === 0) setIsGachaModalOpen(false);
    }, [player, lastGachaRoll, setPlayer, setLastGachaRoll, setIsGachaModalOpen, addLog]);

    const baseEventsPool: ExplorationEvent[] = useMemo(() => [ { description: "Gặp Yêu Lang", monster: true, levelModifier: 0, dropIds: ['cuong_hoa_thach'], amountPerDrop: [1], logColor: 'text-purple-300' }, { description: "Nhặt được Linh Thảo lạ.", result: (p, addItem) => { addItem(ITEM_DB['linh_thao'], 1 + Math.floor(Math.random() * 3)); return `Nhặt Linh Thảo.`; }, logColor: 'text-green-300' }, { description: "Tìm thấy túi Linh Thạch.", result: (p) => { p.linhThach += Math.floor((50 + Math.floor(Math.random() * 150)) * (activeGlobalConfig.EXPLORATION_LT_GAIN_MULTIPLIER || 1)); return `Nhặt Linh Thạch.`; }, logColor: 'text-cyan-300' }, { description: "Không có gì.", result: () => "Tiếp tục.", logColor: 'text-gray-400' }, ], [activeGlobalConfig]);

    const handleThamHiem = useCallback((mode: 'normal' | 'hell' | 'god' | 'secret') => {
        if (!player || player.isBreakingThrough || player.status !== 'normal') return;
        const activityId = mode === 'normal' ? 'thamHiemnormal' : `thamHiem${mode}`;
        if (getActivityUsage(activityId) >= 10 && activityId !== 'thamHiemsecret' ) { addLog(`Đã thám hiểm khu vực này đủ số lần trong ngày.`, "text-yellow-400"); return; }
        setPlayer(prev => prev ? ({...prev, status: 'exploring'}) : null);
        incrementActivityUsage(activityId);
        let eventsPool = [...baseEventsPool];
        let penaltyMultiplier = 1;
        let baseMeditationTime = 5000;
        let logMessagePrefix = "TH Thường: ";
        if (mode === 'hell') { eventsPool.push({ description: "Gặp Ma Quân!", monster: true, levelModifier: 2, dropIds: ['thien_nguyen_dan'], amountPerDrop: [1], rarity: RARITY_LEVELS.MYTHIC }); penaltyMultiplier = 2; baseMeditationTime = 20000; logMessagePrefix = "TH Địa Ngục: "; }
        else if (mode === 'god') { eventsPool.push({ description: "Gặp Thần Tướng!", monster: true, levelModifier: 4, dropIds: ['bat_hoang_giap'], amountPerDrop: [1], rarity: RARITY_LEVELS.ANCIENT }); penaltyMultiplier = 5; baseMeditationTime = 30000; logMessagePrefix = "TH Thần Vực: "; }
        else if (mode === 'secret') { eventsPool = [{ description: "Bí Cảnh: Nhặt được Bản Đồ Cổ.", result: (p, addItem) => { addItem(ITEM_DB['co_dai_ban_do']); return `Nhận Bản Đồ Cổ!`; }, rarity: RARITY_LEVELS.DIVINE }]; logMessagePrefix = "Vào Bí Cảnh: ";}
        const event = eventsPool[Math.floor(Math.random() * eventsPool.length)];
        addLog(logMessagePrefix + event.description, event.logColor || event.rarity?.colorClass || 'text-purple-400');
        setTimeout(() => {
            setPlayer(prevPlayer => {
                if (!prevPlayer) return null;
                let tempPlayer = { ...prevPlayer };
                if (event.monster && prevPlayer.status === 'exploring') {
                    const monsterLevelIndex = Math.max(0, tempPlayer.level + (event.levelModifier || 0));
                    const monsterData = GAME_DATA.levels[Math.min(GAME_DATA.levels.length - 1, monsterLevelIndex)];
                    const playerAttack = tempPlayer.totalStats.attack || 0;
                    const monsterDefense = (monsterData.stats.defense as number) || 1;
                    if (playerAttack < monsterDefense * 0.7 && Math.random() > (tempPlayer.totalStats.luck || 0)) {
                        const tuviLoss = (tempPlayer.tuvi * 0.1 * penaltyMultiplier);
                        tempPlayer.tuvi -= tuviLoss;
                        tempPlayer.hp = 1;
                        tempPlayer.status = 'meditating';
                        addLog(`Yêu thú mạnh! Bị thương, tu vi hao tổn ${formatNumber(tuviLoss)}, tịnh dưỡng ${baseMeditationTime/1000}s!`, 'text-red-500');
                        setTimeout(() => { setPlayer(p => p ? ({ ...p, status: 'normal' }) : null); addLog("Tịnh dưỡng hoàn tất.", "text-green-400"); }, baseMeditationTime);
                    } else {
                        const linhThachGain = Math.floor(((mode === 'normal' ? 50 : 2000) + Math.floor(Math.random() * (mode === 'normal' ? 100 : 5000) * penaltyMultiplier)) * (activeGlobalConfig.EXPLORATION_LT_GAIN_MULTIPLIER || 1));
                        tempPlayer.linhThach += linhThachGain;
                        let itemDropsMessage = "";
                        if (event.dropIds) {
                            event.dropIds.forEach((dropId, index) => {
                                const itemBase = ITEM_DB[dropId];
                                if (itemBase) {
                                    const amountToDrop = event.amountPerDrop ? event.amountPerDrop[index] : (event.amount || 1);
                                    for(let i=0; i < amountToDrop; i++) { const newInst = createInventoryItemFromBase(itemBase); tempPlayer.inventory[newInst.instanceId] = newInst; }
                                    itemDropsMessage += ` [${itemBase.name} x${amountToDrop}]`;
                                }
                            });
                        }
                        addLog(`Tiêu diệt yêu thú! Nhận ${formatNumber(linhThachGain)} LT.${itemDropsMessage}`, 'text-green-400');
                        trackQuestProgress('monstersKilled', 1);
                    }
                } else if (event.result && prevPlayer.status === 'exploring') {
                    const resultMessage = event.result(tempPlayer, addItemToInventory, addLog);
                    if (resultMessage) addLog(resultMessage, 'text-gray-300');
                }
                if (tempPlayer.status === 'exploring') tempPlayer.status = 'normal';
                return tempPlayer;
            });
            trackQuestProgress('exploreCount', 1);
            if (mode === 'secret' || (event.rarity && ALL_RARITIES_ORDERED.findIndex(r => r.name === event.rarity!.name) <= ALL_RARITIES_ORDERED.findIndex(r => r.name === RARITY_LEVELS.DIVINE.name))) { trackQuestProgress('specialEventsFound', 1); }
        }, 1500);
    }, [player, getActivityUsage, setPlayer, incrementActivityUsage, addLog, baseEventsPool, activeGlobalConfig, addItemToInventory, trackQuestProgress]);

    const handleClaimQuestReward = useCallback((questId: string) => {
        setPlayer(prev => {
            if (!prev) return null;
            const questIndex = prev.activeQuests.findIndex(q => q.id === questId);
            if (questIndex === -1) return prev;
            const quest = prev.activeQuests[questIndex];
            const progress = quest.key === 'breakthroughCount' ? prev.level : (prev.questData[quest.key as keyof QuestProgressData] || 0);
            if (progress < quest.target) { addLog("Chưa hoàn thành!", "text-yellow-400"); return prev; }
            let newLinhThach = prev.linhThach;
            let newInventory = { ...prev.inventory };
            let rewardMessage = "Hoàn thành: ";
            if (quest.reward.linhThach) { newLinhThach += quest.reward.linhThach; rewardMessage += `${formatNumber(quest.reward.linhThach)} LT`; }
            if (quest.reward.item) {
                const itemBase = ITEM_DB[quest.reward.item.id];
                if(itemBase) {
                    const amount = quest.reward.amount || 1;
                    for(let i=0; i<amount; i++) { const newInst = createInventoryItemFromBase(itemBase); newInventory[newInst.instanceId] = newInst; }
                    rewardMessage += `${quest.reward.linhThach ? ', ' : ''}[${itemBase.name}] x${amount}`;
                }
            }
            addLog(rewardMessage, 'text-green-400');
            let newActiveQuests = [...prev.activeQuests];
            newActiveQuests.splice(questIndex, 1);
            const currentQuestIds = new Set(newActiveQuests.map(q => q.id));
            const availableNewQuests = GAME_DATA.quests.filter(q => !currentQuestIds.has(q.id));
            if (availableNewQuests.length > 0 && newActiveQuests.length < 5) {
                const newQuestToAdd = availableNewQuests[Math.floor(Math.random() * availableNewQuests.length)];
                const initialProgressForNewQuest = newQuestToAdd.key === 'breakthroughCount' ? prev.level : (prev.questData[newQuestToAdd.key as keyof QuestProgressData] || 0);
                newActiveQuests.push({ ...newQuestToAdd, progress: initialProgressForNewQuest });
            }
            return { ...prev, linhThach: newLinhThach, inventory: newInventory, activeQuests: newActiveQuests };
        });
    }, [setPlayer, addLog]);

    const handleCraftTalisman = useCallback((recipeId: string) => {
        if (!player) return;
        const recipe = GAME_DATA.talismanRecipes.find(r => r.id === recipeId);
        if (!recipe) { addLog("Không tìm thấy công thức Thần Phù!", "text-red-500"); return;}
        setPlayer(prev => {
            if (!prev) return null;
            const canCraft = Object.entries(recipe.materials).every(([itemId, amount]) => countItemInInventory(prev.inventory, itemId) >= amount);
            if (!canCraft) { addLog("Không đủ nguyên liệu!", "text-red-400"); return prev; }
            let newInventory = { ...prev.inventory };
            for (const [itemId, amount] of Object.entries(recipe.materials)) {
                newInventory = removeItemsFromInventory(newInventory, itemId, amount);
            }
            const talismanItemDefinition = ITEM_DB[recipe.talismanItemId];
            if (!talismanItemDefinition) { addLog(`Lỗi: Không tìm thấy định nghĩa vật phẩm cho Thần Phù ${recipe.talismanItemId}`, "text-red-500"); return prev; }
            const newTalismanInstance = createInventoryItemFromBase(talismanItemDefinition);
            newInventory[newTalismanInstance.instanceId] = newTalismanInstance;
            addLog(`Chế tạo [${recipe.name}] thành công!`, recipe.rarity.colorClass);
            return { ...prev, inventory: newInventory };
        });
    }, [player, setPlayer, addLog]);

    const getSpecialItemPrice = (item: BaseItem): number => {
        if (item.id === 've_tu_luyen_thoi_khong') {
            return 10000;
        }
        switch (item.rarity.name) {
            case RARITY_LEVELS.COMMON.name: return 500;
            case RARITY_LEVELS.UNCOMMON.name: return 1500;
            case RARITY_LEVELS.RARE.name: return 5000;
            case RARITY_LEVELS.EPIC.name: return 20000;
            case RARITY_LEVELS.LEGENDARY.name: return 100000;
            case RARITY_LEVELS.MYTHIC.name: return 400000;
            case RARITY_LEVELS.DIVINE.name: return 1600000;
            case RARITY_LEVELS.ANCIENT.name: return 6400000;
            case RARITY_LEVELS.ULTIMATE.name: return 25600000;
            default: return 1000;
        }
    };

    const handleBuySpecialItem = useCallback((itemId: string) => {
        if (!player) return;
        const item = ITEM_DB[itemId];
        if (!item) return;
        const price = getSpecialItemPrice(item);
        setPlayer(prev => {
            if (!prev) return null;
            if (prev.linhThach < price) {
                addLog("Linh thạch không đủ!", "text-red-400"); return prev;
            }
            const newInventory = { ...prev.inventory };
            const newItemInstance = createInventoryItem(itemId);
            if(newItemInstance) newInventory[newItemInstance.instanceId] = newItemInstance;
            addLog(`Mua [${item.name}] với giá ${formatNumber(price)} LT thành công!`, item.rarity.colorClass);
            return { ...prev, linhThach: prev.linhThach - price, inventory: newInventory };
        });
    }, [player, setPlayer, addLog]);

    const handlePromoCode = useCallback(() => {
        if (!player) return;
        const code = promoCodeInput.trim().toLowerCase();
        if (code === "luuvan") {
            if (player.promoCodesUsed.includes(code)) { addLog("Đã dùng giftcode này!", "text-yellow-400"); }
            else {
                setPlayer(prev => { if (!prev) return null; const newPromoUsed = [...prev.promoCodesUsed, code]; return { ...prev, linhThach: prev.linhThach + 500000, promoCodesUsed: newPromoUsed, } });
                addLog("Nhận 500,000 LT từ giftcode LuuVan!", "text-green-400");
            }
        } else { addLog("Giftcode không hợp lệ.", "text-red-400"); }
        setPromoCodeInput('');
    }, [player, promoCodeInput, setPlayer, addLog, setPromoCodeInput]);

    const toggleInventoryItemSelection = useCallback((instanceId: string) => {
        setSelectedInventoryItems(prev => prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]);
    }, [setSelectedInventoryItems]);

    const handleSellSelectedInventoryItems = useCallback(() => {
        if (selectedInventoryItems.length === 0 || !player) return;
        let soldCount = 0;
        let linhThachGained = 0;
        setPlayer(prev => {
            if (!prev) return null;
            const newInventory = { ...prev.inventory };
            selectedInventoryItems.forEach(id => {
                const item = newInventory[id];
                if (item) {
                    const isEquipped = Object.values(prev.equipment).some(eq => eq?.instanceId === id);
                    if (isEquipped) { addLog(`[${item.name}] đang trang bị!`, 'text-yellow-400'); return; }
                    if (ALL_RARITIES_ORDERED.findIndex(r => r.name === item.rarity.name) >= ALL_RARITIES_ORDERED.findIndex(r => r.name === RARITY_LEVELS.MYTHIC.name)) { addLog(`[${item.name}] quá quý giá!`, 'text-orange-400'); return; } // Corrected logic: higher index is rarer
                    const rarityIndex = ALL_RARITIES_ORDERED.findIndex(r => r.name === item.rarity.name);
                    linhThachGained += Math.max(10, (rarityIndex + 1) * 50 * (item.refineLevel + 1)); // Corrected rarity value
                    delete newInventory[id];
                    soldCount++;
                }
            });
            if (soldCount > 0) { addLog(`Bán ${soldCount} vật phẩm, nhận ${formatNumber(linhThachGained)} LT.`, 'text-green-400'); }
            return { ...prev, linhThach: prev.linhThach + linhThachGained, inventory: newInventory };
        });
        setSelectedInventoryItems([]);
    }, [selectedInventoryItems, player, setPlayer, addLog, setSelectedInventoryItems]);

    const handleDaoKiepChallenge = useCallback(() => {
        if (!player || player.status !== 'normal') return;
        setPlayer(p => p ? {...p, status: 'exploring'} : null);
        incrementActivityUsage('daoKiepChallenge');
        addLog("Đối mặt Thiên Kiếp... Sấm sét rền vang!", RARITY_LEVELS.LEGENDARY.colorClass);
        setTimeout(() => {
            setPlayer(p => {
                if(!p) return null;
                const success = Math.random() < (0.3 + (p.totalStats.luck || 0) * 0.2);
                if(success) {
                    const tuviBoost = (GAME_DATA.levels[p.level].tuviMax || 1000) * 0.1;
                    p.tuvi += tuviBoost;
                    addItemToInventory(ITEM_DB['thien_nguyen_dan'], 1);
                    addLog(`Vượt Kiếp thành công! Tu vi tăng ${formatNumber(tuviBoost)}, nhận Tiên Duyên!`, 'text-green-400');
                } else {
                    p.hp = Math.max(1, Math.floor((p.totalStats.hp||1) * 0.3));
                    p.tuvi *= 0.9;
                    addLog("Vượt Kiếp thất bại! Thân thể trọng thương, tu vi hao tổn.", 'text-red-500');
                }
                return {...p, status: 'meditating'};
            });
            setTimeout(() => setPlayer(p => p ? {...p, status: 'normal'} : null), 15000);
        }, 3000);
    }, [player, setPlayer, incrementActivityUsage, addLog, addItemToInventory]);

    const handleSectRaid = useCallback((targetSectId?: string) => {
        if (!player || player.status !== 'normal') return;
        if (!targetSectId) { addLog("Lỗi: Không có mục tiêu tông môn để cướp.", "text-red-400"); return; }
        setPlayer(p => p ? {...p, status: 'exploring'} : null);
        incrementActivityUsage('sectRaid');
        const targetSect = GAME_DATA.sects[targetSectId];
        if (!targetSect) { addLog("Tông môn mục tiêu không tồn tại!", "text-red-500"); setPlayer(p => p ? {...p, status: 'normal'} : null); return; }
        addLog(`Đang tập kích [${targetSect.name}]...`, RARITY_LEVELS.EPIC.colorClass);
        setTimeout(() => {
            setPlayer(p => {
                if(!p) return null;
                const success = Math.random() < (0.4 + (p.totalStats.luck || 0) * 0.15);
                if(success) {
                    const ltGain = Math.floor(500 + Math.random() * 2000);
                    p.linhThach += ltGain;
                    addItemToInventory(ITEM_DB['cuong_hoa_thach'], Math.floor(Math.random()*3)+1);
                    addLog(`Cướp bóc [${targetSect.name}] thành công! Cướp được ${formatNumber(ltGain)} LT và một ít tài nguyên!`, 'text-green-400');
                } else {
                    p.hp = Math.max(1, Math.floor((p.totalStats.hp||1) * 0.6));
                    addLog(`Bị trưởng lão [${targetSect.name}] đánh lui! Bị thương nhẹ.`, 'text-red-500');
                }
                return {...p, status: 'meditating'};
            });
            setTimeout(() => setPlayer(p => p ? {...p, status: 'normal'} : null), 10000);
        }, 2500);
    }, [player, setPlayer, incrementActivityUsage, addLog, addItemToInventory]);

    const handlePvpChallenge = useCallback(() => {
        if (!player || player.status !== 'normal') return;
        setPlayer(p => p ? {...p, status: 'exploring'} : null);
        incrementActivityUsage('pvpChallenge');
        addLog("Khiêu chiến một tu sĩ ngang cấp...", RARITY_LEVELS.EPIC.colorClass);
        setTimeout(() => {
            setPlayer(p => {
                if(!p) return null;
                const win = Math.random() < (0.5 + (p.totalStats.luck || 0) * 0.1);
                if(win) {
                    const ltGain = Math.floor(300 + Math.random() * 1500);
                    p.linhThach += ltGain;
                    addLog(`Chiến thắng tu sĩ! Đoạt được ${formatNumber(ltGain)} LT!`, 'text-green-400');
                } else {
                    p.hp = Math.max(1, Math.floor((p.totalStats.hp||1) * 0.7));
                    addLog(`Thua trận! Mất mặt nhưng không mất nhiều.`, 'text-orange-400');
                }
                return {...p, status: 'meditating'};
            });
            setTimeout(() => setPlayer(p => p ? {...p, status: 'normal'} : null), 8000);
        }, 2000);
    }, [player, setPlayer, incrementActivityUsage, addLog]);

    const handleViewLeaderboard = useCallback(() => {
        if (!player) return;
        addLog("Bảng Xếp Hạng: Lực Chiến của bạn là " + formatNumber(player.combatPower), RARITY_LEVELS.RARE.colorClass);
        incrementActivityUsage('viewLeaderboard');
    }, [player, addLog, incrementActivityUsage]);

    const handleChallengeBoss = useCallback((bossId: string) => {
        if (!player || player.status !== 'normal') return;
        const boss = GAME_DATA.bosses[bossId];
        if (!boss) { addLog("Boss không tồn tại!", "text-red-500"); return; }
        if (player.level < boss.levelRequirement) { addLog(`Cảnh giới không đủ để khiêu chiến [${boss.name}]! Cần đạt cấp QT ${boss.levelRequirement}.`, "text-yellow-400"); return; }

        const activityKey = `bossChallenge_${boss.id}`;
        const winKey = `bossWin_${boss.id}`;
        const attemptLimit = boss.dailyAttemptLimit || 3;

        if (getActivityUsage(activityKey) >= attemptLimit) {
            addLog(`Đã hết lượt khiêu chiến [${boss.name}] hôm nay.`, "text-yellow-400"); return;
        }

        setPlayer(p => p ? {...p, status: 'fightingBoss'} : null);
        incrementActivityUsage(activityKey);
        addLog(`Bắt đầu khiêu chiến [${boss.name}] (${boss.rarity.name})!`, boss.rarity.colorClass);

        let playerCurrentHp = player.hp;
        let bossCurrentHp = boss.stats.hp || 1;
        const combatLog: string[] = [];
        let combatOver = false;
        let playerWon = false;

        for (let turn = 1; turn <= 15; turn++) {
            if (combatOver) break;
            combatLog.push(`--- Hiệp ${turn} ---`);
            let playerDamage = 0;
            if (Math.random() < (player.totalStats.accuracy || 0.7)) {
                playerDamage = (player.totalStats.attack || 0);
                if (Math.random() < (player.totalStats.critChance || 0)) playerDamage *= (player.totalStats.critDamage || 1.5);
                playerDamage = Math.floor(Math.max(1, playerDamage - (boss.stats.defense || 0) * 0.5));
                bossCurrentHp -= playerDamage;
                combatLog.push(`Bạn gây ${formatNumber(playerDamage)} ST cho ${boss.name}. HP Boss còn ${formatNumber(bossCurrentHp)}.`);
            } else {
                combatLog.push(`Bạn tấn công trượt ${boss.name}!`);
            }
            if (bossCurrentHp <= 0) { playerWon = true; combatOver = true; break; }

            let bossDamage = 0;
            if (Math.random() < (boss.stats.accuracy || 0.7)) {
                bossDamage = (boss.stats.attack || 0);
                if (Math.random() < (boss.stats.critChance || 0)) bossDamage *= (boss.stats.critDamage || 1.5);
                bossDamage = Math.floor(Math.max(1, bossDamage - (player.totalStats.defense || 0) * 0.5));
                playerCurrentHp -= bossDamage;
                combatLog.push(`${boss.name} gây ${formatNumber(bossDamage)} ST cho bạn. HP bạn còn ${formatNumber(playerCurrentHp)}.`);
            } else {
                combatLog.push(`${boss.name} tấn công trượt!`);
            }
            if (playerCurrentHp <= 0) { playerWon = false; combatOver = true; break; }
        }

        setTimeout(() => {
            setPlayer(p => {
                if(!p) return null;
                let finalPlayer = {...p};
                combatLog.forEach(logLine => addLog(logLine, 'text-gray-400'));
                if (playerWon) {
                    addLog(`CHIẾN THẮNG [${boss.name}]!`, 'text-green-500 font-bold text-lg');
                    const ltGained = Math.floor((boss.rewards.linhThachMin + Math.random() * (boss.rewards.linhThachMax - boss.rewards.linhThachMin)) * (activeGlobalConfig.BOSS_REWARD_MULTIPLIER || 1));
                    finalPlayer.linhThach += ltGained;
                    addLog(`Nhận ${formatNumber(ltGained)} Linh Thạch.`, 'text-cyan-400');
                    if (boss.rewards.tuViGain) {
                        finalPlayer.tuvi += boss.rewards.tuViGain;
                        addLog(`Nhận ${formatNumber(boss.rewards.tuViGain)} Tu Vi.`, 'text-yellow-300');
                    }
                    boss.rewards.itemDrops.forEach(drop => {
                        if (Math.random() < drop.chance) {
                            const amount = drop.minAmount + Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1));
                            const itemBase = ITEM_DB[drop.itemId];
                            if (itemBase) {
                                addItemToInventory(itemBase, amount);
                                addLog(`Nhận [${itemBase.name}] x${amount}!`, itemBase.rarity.colorClass);
                            }
                        }
                    });
                    trackQuestProgress('bossesKilled', 1);
                    incrementActivityUsage(winKey);
                } else {
                    addLog(`THẤT BẠI trước [${boss.name}]!`, 'text-red-500 font-bold text-lg');
                    finalPlayer.hp = 1;
                    finalPlayer.status = 'meditating';
                    setTimeout(() => setPlayer(currentP => currentP ? {...currentP, status: 'normal'} : null), 15000);
                }
                finalPlayer.hp = playerWon ? playerCurrentHp : 1;
                finalPlayer.status = playerWon ? 'normal' : 'meditating';
                return finalPlayer;
            });
        }, Math.max(1000, 200 * combatLog.length));
    }, [player, setPlayer, addLog, getActivityUsage, incrementActivityUsage, activeGlobalConfig, addItemToInventory, trackQuestProgress]);

    const getAllUsernamesForAdmin = useCallback((): string[] => {
        console.warn("getAllUsernamesForAdmin: Needs Supabase Admin/Function integration.");
        return [];
    }, []);

    const loadPlayerDataForAdmin = useCallback((usernameOrUid: string): Player | null => {
        console.warn("loadPlayerDataForAdmin: Needs Supabase Admin/Function integration.");
        const localData = localStorage.getItem(`tu_tien_player_data_${usernameOrUid}`);
        if(localData) return JSON.parse(localData);
        return null;
    }, []);

    const savePlayerDataForAdmin = useCallback((usernameOrUid: string, playerDataToSave: Player) => {
        console.warn("savePlayerDataForAdmin: Needs Supabase Admin/Function integration.");
        localStorage.setItem(`tu_tien_player_data_${usernameOrUid}`, JSON.stringify(playerDataToSave));
        addLog(`Dữ liệu cho ${usernameOrUid} đã được lưu (Admin - Local Placeholder).`, 'text-red-400');
    }, [addLog]);

    const handleSaveGlobalConfigOverrides = useCallback((newOverrides: GlobalConfigOverrides) => {
        setActiveGlobalConfig({ ...initialGlobalConfigOverrides, ...newOverrides });
        localStorage.setItem(LS_GLOBAL_CONFIG_OVERRIDES_KEY, JSON.stringify(newOverrides));
        addLog("Cấu hình toàn cục overrides đã được lưu (Superadmin).", "text-orange-500");
    }, [setActiveGlobalConfig, addLog]);

    const handleResetGlobalConfigOverrides = useCallback(() => {
        setActiveGlobalConfig(initialGlobalConfigOverrides);
        localStorage.removeItem(LS_GLOBAL_CONFIG_OVERRIDES_KEY);
        addLog("Cấu hình toàn cục overrides đã được reset về mặc định (Superadmin).", "text-yellow-500");
    }, [setActiveGlobalConfig, addLog]);

    const handleSetGlobalAnnouncement = useCallback((message: string) => {
        const newAnnouncement = { message, timestamp: Date.now() };
        localStorage.setItem(LS_GLOBAL_ANNOUNCEMENT_KEY, JSON.stringify(newAnnouncement));
        setGlobalAnnouncement(newAnnouncement);
        setShowMarquee(true);
    }, [setGlobalAnnouncement, setShowMarquee]);

    const handleMarqueeComplete = useCallback(() => {
        setShowMarquee(false);
        if (player && globalAnnouncement) {
            setPlayer(p => p ? ({ ...p, lastAnnouncementTimestamp: globalAnnouncement.timestamp }) : null);
        }
    }, [setShowMarquee, player, globalAnnouncement, setPlayer]);

    const handleSuperAdminResetAllActivityUsageInLocalStorage = useCallback(async () => {
        if(!isSuperAdmin) return;
        addLog("Reset lượt hoạt động toàn cục qua Supabase DB sẽ cần một Function hoặc thao tác DB trực tiếp.", "text-red-600 font-bold");
    }, [isSuperAdmin, addLog]);


    const filteredInventory = useMemo(() => {
        if (!player) return [];
        return Object.values(player.inventory)
            .filter(item => (inventoryFilterRarity === 'all' || item.rarity.name === inventoryFilterRarity) && (inventoryFilterType === 'all' || item.type === inventoryFilterType))
            .sort((a,b) => ALL_RARITIES_ORDERED.findIndex(r => r.name === a.rarity.name) - ALL_RARITIES_ORDERED.findIndex(r => r.name === b.rarity.name) || a.name.localeCompare(b.name) ); // findIndex is correct here
    }, [player, inventoryFilterRarity, inventoryFilterType]);

    const specialShopItems = useMemo(() => {
        return Object.values(ITEM_DB)
            .sort((a,b) =>
                ALL_RARITIES_ORDERED.findIndex(r => r.name === a.rarity.name) -
                ALL_RARITIES_ORDERED.findIndex(r => r.name === b.rarity.name) ||
                a.name.localeCompare(b.name)
            );
    }, []);

    if (isLoadingUser && !isAdmin && !isSuperAdmin) {
        return <div className="text-white text-center p-10">Đang tải và khởi tạo phiên...</div>;
    }

    if (!supabaseUser && !isAdmin && !isSuperAdmin) {
      return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} initialError={authError} />;
    }

    if (supabaseUser && !player && !isAdmin && !isSuperAdmin) {
        return <div className="text-white text-center p-10">Đang tải dữ liệu người chơi từ server Supabase...</div>;
    }

    const activityTabProps: ActivityTabProps | null = player ? { player, onExplore: handleThamHiem, onDaoKiepChallenge: handleDaoKiepChallenge, onSectRaid: handleSectRaid, onPvpChallenge: handlePvpChallenge, onViewLeaderboard: handleViewLeaderboard, getActivityUsage, gameData: GAME_DATA, addLog, setPlayer } : null;
    const bossBattleTabProps: BossBattleTabProps | null = player ? {player, gameData: GAME_DATA, onChallengeBoss: handleChallengeBoss, getActivityUsage} : null;
    const adminPanelProps: AdminPanelProps = { isAdmin, getAllUsernames: getAllUsernamesForAdmin, loadPlayerDataForAdmin, savePlayerDataForAdmin, addLog, itemDB: ITEM_DB, gameData: GAME_DATA, onSetGlobalAnnouncement: handleSetGlobalAnnouncement };
    const superAdminPanelProps: SuperAdminPanelProps = { isSuperAdmin, currentOverrides: activeGlobalConfig, onSaveOverrides: handleSaveGlobalConfigOverrides, onResetOverrides: handleResetGlobalConfigOverrides, onSetGlobalAnnouncement: handleSetGlobalAnnouncement, addLog, onResetAllPlayerActivityUsage: handleSuperAdminResetAllActivityUsageInLocalStorage };

    return (
        <div className="p-1 sm:p-2 md:p-4 h-full">
            {showMarquee && globalAnnouncement && <GlobalMarquee message={globalAnnouncement.message} onComplete={handleMarqueeComplete} isAdminDismissable={isAdmin || isSuperAdmin} />}
            {(player || isAdmin || isSuperAdmin) && (
                <div className="absolute top-2 right-2 z-50">
                    <ActionButton onClick={handleLogout} className="!w-auto !py-1 !px-3 text-xs !bg-red-800 hover:!bg-red-700" fullWidth={false}>
                        Đăng Xuất {isAdmin ? "Admin" : isSuperAdmin ? "SuperAdmin" : supabaseUser?.email ? `(${supabaseUser.email.substring(0, supabaseUser.email.indexOf('@'))})` : ""}
                    </ActionButton>
                </div>
            )}
            <div className="game-container max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-[minmax(400px,450px)_1fr_minmax(450px,500px)] gap-4 h-full max-h-full">
                {/* Left Panel */}
                 <Panel className="flex flex-col overflow-hidden">
                    <div className="flex border-b border-gray-700 sticky top-0 bg-[rgba(17,24,39,0.9)] z-10 backdrop-blur-sm shrink-0 overflow-x-auto">
                        <TabButton onClick={() => setActiveMainTab('char')} isActive={activeMainTab === 'char'}>Nhân Vật</TabButton>
                        <TabButton onClick={() => setActiveMainTab('congPhap')} isActive={activeMainTab === 'congPhap'}>Công Pháp</TabButton>
                        <TabButton onClick={() => setActiveMainTab('craft')} isActive={activeMainTab === 'craft'}>Luyện Chế</TabButton>
                        <TabButton onClick={() => setActiveMainTab('activity')} isActive={activeMainTab === 'activity'}>Hoạt Động</TabButton>
                        <TabButton onClick={() => setActiveMainTab('boss')} isActive={activeMainTab === 'boss'}>Khiêu Chiến Boss</TabButton>
                        {isAdmin && <TabButton onClick={() => setActiveMainTab('admin')} isActive={activeMainTab === 'admin'}>Admin</TabButton>}
                        {isSuperAdmin && <TabButton onClick={() => setActiveMainTab('superAdmin')} isActive={activeMainTab === 'superAdmin'}>SUPER ADMIN</TabButton>}
                    </div>
                    <div className="flex-grow overflow-y-auto scrollbar-thin p-1">
                        {player && activeMainTab === 'char' && <CharacterTab player={player} onCharacterNameChange={handleCharacterNameChange} onLogout={handleLogout} activeGlobalConfig={activeGlobalConfig} />}
                        {player && activeMainTab === 'congPhap' && <CongPhapTab player={player} onLearnCongPhap={handleLearnCongPhap} onAbandonCongPhap={handleAbandonCongPhap} />}
                        {player && activeMainTab === 'craft' && <CraftingTab player={player} onRefineItem={handleRefineItem} onCraftTalisman={handleCraftTalisman} addLog={addLog} />}
                        {player && activeMainTab === 'activity' && activityTabProps && <ActivityTab {...activityTabProps} />}
                        {player && activeMainTab === 'boss' && bossBattleTabProps && <BossBattleTab {...bossBattleTabProps} />}
                        {activeMainTab === 'admin' && <AdminPanel {...adminPanelProps} />}
                        {activeMainTab === 'superAdmin' && <SuperAdminPanel {...superAdminPanelProps} />}
                        {!player && !['admin', 'superAdmin'].includes(activeMainTab) && supabaseUser && <div className="p-4 text-center text-gray-400">Không có dữ liệu nhân vật. Đang chờ đồng bộ...</div>}
                         {!player && !['admin', 'superAdmin'].includes(activeMainTab) && !supabaseUser && <div className="p-4 text-center text-gray-400">Vui lòng đăng nhập để bắt đầu.</div>}
                    </div>
                </Panel>

                 {/* Center Panel */}
                <Panel className="flex flex-col overflow-hidden">
                    <h2 className="text-xl font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-2 mb-4 sticky top-0 bg-[rgba(17,24,39,0.9)] z-10 backdrop-blur-sm">Nhật Ký Tu Luyện</h2>
                    <div className="flex-grow overflow-y-auto scrollbar-thin pr-2 space-y-1 text-xs">
                        {gameLog.map(entry => (
                            <p key={entry.id} className={`${entry.colorClass} opacity-90 leading-tight`}>{entry.message}</p>
                        ))}
                    </div>
                     {player && (
                        <div className="mt-auto pt-2 border-t border-gray-600">
                            <ActionButton
                                onClick={() => handleThamHiem('normal')}
                                disabled={player.isBreakingThrough || player.status === 'meditating' || player.status === 'exploring' || player.status === 'fightingBoss'}
                                className="text-sm !py-2 col-span-2"
                            >
                                Thám Hiểm Bình Thường
                            </ActionButton>
                        </div>
                     )}
                </Panel>

                {/* Right Panel */}
                <Panel className="flex flex-col overflow-hidden">
                     <div className="flex border-b border-gray-700 sticky top-0 bg-[rgba(17,24,39,0.9)] z-10 backdrop-blur-sm shrink-0">
                        <TabButton onClick={() => setActiveShopTab('gacha')} isActive={activeShopTab === 'gacha'}>Tụ Bảo Các</TabButton>
                        <TabButton onClick={() => setActiveShopTab('sect')} isActive={activeShopTab === 'sect'}>Tông Môn</TabButton>
                        <TabButton onClick={() => setActiveShopTab('special')} isActive={activeShopTab === 'special'}>Kỳ Trân Các</TabButton>
                    </div>
                    <div className="flex-grow overflow-y-auto scrollbar-thin p-1">
                    {player ? (
                        <>
                            {activeShopTab === 'gacha' && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-400 mb-2">Quay thưởng để nhận vật phẩm quý hiếm.</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionButton onClick={() => handleQuayBaoVat(1)} disabled={player.linhThach < (1000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1)) || player.isBreakingThrough || player.status !== 'normal'}>Quay x1 ({formatNumber(1000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1))} LT)</ActionButton>
                                        <ActionButton onClick={() => handleQuayBaoVat(10)} disabled={player.linhThach < (9000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1)) || player.isBreakingThrough || player.status !== 'normal'}>Quay x10 ({formatNumber(9000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1))} LT)</ActionButton>
                                        <ActionButton onClick={() => handleQuayBaoVat(50)} disabled={player.linhThach < (42500 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1)) || player.isBreakingThrough || player.status !== 'normal'}>Quay x50 ({formatNumber(42500 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1))} LT)</ActionButton>
                                        <ActionButton onClick={() => handleQuayBaoVat(100)} disabled={player.linhThach < (80000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1)) || player.isBreakingThrough || player.status !== 'normal'}>Quay x100 ({formatNumber(80000 * (activeGlobalConfig.GACHA_COST_MULTIPLIER || 1))} LT)</ActionButton>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-center">May mắn: {((player.totalStats.luck || 0) * 100).toFixed(1)}%</p>
                                </div>
                            )}
                            {activeShopTab === 'sect' && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2">Tông Môn</h3>
                                    {player.sect ? (
                                        <div>
                                            <p>Đang ở: <span className="font-semibold text-yellow-400">{GAME_DATA.sects[player.sect].name}</span></p>
                                            <p className="text-sm text-gray-300">Bonus: {GAME_DATA.sects[player.sect].desc}</p>
                                            <ActionButton onClick={handleLeaveSect} className="mt-2 !bg-orange-600 hover:!bg-orange-500 text-sm">Rời Tông Môn</ActionButton>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.values(GAME_DATA.sects).map((sect) => (
                                                <ActionButton key={sect.id} onClick={() => handleJoinSect(sect.id)} disabled={player.isBreakingThrough || player.status !== 'normal'}>
                                                    Gia Nhập {sect.name} ({sect.desc})
                                                </ActionButton>
                                            ))}
                                        </div>
                                    )}
                                     <ActionButton onClick={() => addLog("Tự tạo Tông Môn là một tính năng cực kỳ phức tạp và sẽ được phát triển trong tương lai rất xa.", "text-purple-400")} className="mt-4 !bg-gray-600 hover:!bg-gray-500 text-sm" disabled={true}>
                                        Tự Tạo Tông Môn (Rất Xa)</ActionButton>
                                    <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2 mt-6">Giftcode</h3>
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value)} placeholder="Nhập Giftcode" className="bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600 focus:border-yellow-500 outline-none flex-grow"/>
                                        <ActionButton onClick={handlePromoCode} className="text-sm !py-1.5 !px-3 !mb-0" fullWidth={false}>Nhận</ActionButton>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2 mt-6">Nhiệm Vụ ({player.activeQuests.length}/5)</h3>
                                     <div className="space-y-2">
                                        {player.activeQuests.map(quest => {
                                            const progress = quest.key === 'breakthroughCount' ? player.level : (player.questData[quest.key as keyof QuestProgressData] || 0);
                                            const isCompleted = progress >= quest.target;
                                            return (
                                                <div key={quest.id} className="bg-black/20 p-2 rounded border border-gray-700">
                                                    <p className="text-sm text-gray-200">{quest.desc} ({formatNumber(progress)}/{formatNumber(quest.target)})</p>
                                                    <p className="text-xs text-gray-400">Thưởng: {quest.reward.linhThach ? `${formatNumber(quest.reward.linhThach)} LT` : ''} {quest.reward.item ? `${quest.reward.linhThach ? ', ' : ''}${ITEM_DB[quest.reward.item.id]?.name || '?'} x${quest.reward.amount || 1}` : ''}</p>
                                                    <ActionButton onClick={() => handleClaimQuestReward(quest.id)} disabled={!isCompleted || player.status !== 'normal'} className="text-xs !py-1 mt-1">{isCompleted ? "Nhận Thưởng" : "Chưa Xong"}</ActionButton>
                                                </div>);})}
                                        {player.activeQuests.length === 0 && <p className="text-sm text-gray-500">Không có nhiệm vụ.</p>}
                                    </div>
                                </div>
                            )}
                            {activeShopTab === 'special' && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-400 mb-4">Nơi bán các kỳ trân dị bảo.</p>
                                    <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 scrollbar-thin">
                                        {specialShopItems.map(item => {
                                            const price = getSpecialItemPrice(item);
                                            return (<ItemDisplay
                                                        key={item.id}
                                                        item={item}
                                                        showButton={
                                                            <ActionButton
                                                                onClick={() => handleBuySpecialItem(item.id)}
                                                                className="text-xs !p-1 !mb-0 !bg-red-600 hover:!bg-red-500 rounded-full"
                                                                fullWidth={false}
                                                                disabled={player.linhThach < price || player.isBreakingThrough || player.status !== 'normal'}
                                                            >
                                                                Mua ({formatNumber(price)} LT)
                                                            </ActionButton>
                                                        }
                                                    />);
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* Inventory UI */}
                            <div className="mt-6 pt-4 border-t border-gray-600">
                                <h3 className="text-lg font-bold text-[#f3b63a] border-b border-[#4a4a4a] pb-1 mb-2">Túi Càn Khôn ({Object.keys(player.inventory).length}/100)</h3>
                                <div className="flex flex-wrap gap-2 mb-3 items-center text-xs">
                                    <select value={inventoryFilterRarity} onChange={e => setInventoryFilterRarity(e.target.value as InventoryFilterRarity)} className="bg-gray-700 text-white p-1 rounded border border-gray-600">
                                        <option value="all">Tất Cả Phẩm Chất</option>
                                        {ALL_RARITIES_ORDERED.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <select value={inventoryFilterType} onChange={e => setInventoryFilterType(e.target.value as InventoryFilterType)} className="bg-gray-700 text-white p-1 rounded border border-gray-600">
                                        {ITEM_TYPES_FOR_FILTER.map(type => <option key={type} value={type}>{ITEM_TYPE_TRANSLATIONS[type]}</option>)}
                                    </select>
                                    <ActionButton onClick={handleSellSelectedInventoryItems} disabled={selectedInventoryItems.length === 0 || player.status !== 'normal'} className="!bg-red-700 hover:!bg-red-600 !text-xs !py-1 !px-2 !mb-0" fullWidth={false}>Bán ({selectedInventoryItems.length})</ActionButton>
                                </div>
                                <div className="space-y-1 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                                    {filteredInventory.length === 0 && <p className="text-sm text-gray-500">Túi đồ trống.</p>}
                                    {filteredInventory.map(item => (
                                        <ItemDisplay key={item.instanceId} item={item} isSelected={selectedInventoryItems.includes(item.instanceId)} onClick={() => toggleInventoryItemSelection(item.instanceId)}
                                            showButton={ <div className="flex gap-1"> {(item.type === 'equipment' && item.slot && (!player.equipment[item.slot as EquipmentSlot] || player.equipment[item.slot as EquipmentSlot]?.instanceId !== item.instanceId)) && ( <ActionButton onClick={(e) => { e.stopPropagation(); handleEquipItem(item.instanceId); }} className="text-xs !p-1 !mb-0 !bg-green-600 hover:!bg-green-500" fullWidth={false} disabled={player.status !== 'normal'}>Trang Bị</ActionButton> )} {(item.type === 'consumable' || item.type === 'pill' || item.type === 'offlineTicket' || item.type === 'talisman') && ( <ActionButton onClick={(e) => { e.stopPropagation(); handleUseItem(item.instanceId); }} className="text-xs !p-1 !mb-0 !bg-blue-500 hover:!bg-blue-400" fullWidth={false} disabled={player.status !== 'normal'}>Dùng</ActionButton> )} </div> } />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : ( <div className="p-4 text-center text-gray-400">{isAdmin || isSuperAdmin ? "Admin/SuperAdmin không có nhân vật." : "Vui lòng đăng nhập để xem thông tin."}</div> )}
                    </div>
                </Panel>
            </div>
            { player && <GachaModal isOpen={isGachaModalOpen} onClose={() => setIsGachaModalOpen(false)} gachaResult={lastGachaRoll} onSellSelected={handleSellGachaItems} />}
        </div>
    );
};
export default App;
