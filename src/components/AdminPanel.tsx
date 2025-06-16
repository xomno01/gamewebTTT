import React, { useState, useEffect, useMemo } from 'react';
import { Player, AdminPanelProps, InventoryItem, BaseItem, LevelData, QuestProgressData, PlayerActivityUsage, BaseStats, ItemBonus } from '../types';
import { ITEM_DB, GAME_DATA, ALL_RARITIES_ORDERED, EQUIPMENT_SLOT_NAMES } from '../constants';
import { createInventoryItemFromBase, generateNewInstanceId, createInventoryItem } from '../utils/playerUtils';
import { formatNumber } from '../utils/formatters';
import ItemDisplay from './ItemDisplay';
import ActionButton from './ActionButton';

const LS_PLAYER_DATA_PREFIX = 'tu_tien_player_data_';

const questKeyToVietnameseAdmin: Record<keyof QuestProgressData | string, string> = {
    gachaCount: "Lượt Quay Gacha",
    exploreCount: "Lượt Thám Hiểm",
    refineCount: "Lượt Cường Hóa",
    breakthroughCount: "Lần Đột Phá (Cấp QT)",
    specialEventsFound: "Sự Kiện Đặc Biệt",
    monstersKilled: "Yêu Thú Tiêu Diệt",
};

const activityIdToVietnameseAdmin: Record<string, string> = {
    thamHiemnormal: "TH Thường",
    thamHiemhell: "TH Địa Ngục",
    thamHiemgod: "TH Thần Vực",
    thamHiemsecret: "TH Bí Cảnh",
    daoKiepChallenge: "Khiêu Chiến Đạo Kiếp",
    sectRaid: "Cướp Tông Môn",
    pvpChallenge: "Khiêu Chiến Tu Sĩ",
    viewLeaderboard: "Xem BXH",
};


const AdminPanel: React.FC<AdminPanelProps> = ({ 
    isAdmin, 
    getAllUsernames, 
    loadPlayerDataForAdmin, 
    savePlayerDataForAdmin, 
    addLog, 
    itemDB, 
    gameData,
    onSetGlobalAnnouncement 
}) => {
    const [allUsernamesState, setAllUsernamesState] = useState<string[]>([]);
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
    const [selectedPlayerData, setSelectedPlayerData] = useState<Player | null>(null);
    
    const [addItemId, setAddItemId] = useState<string>(Object.keys(itemDB)[0] || '');
    const [addItemQuantity, setAddItemQuantity] = useState<number>(1);
    const [addCongPhapId, setAddCongPhapId] = useState<string>(Object.values(itemDB).find(item => item.type === 'congPhap')?.id || '');
    const [announcementMessage, setAnnouncementMessage] = useState('');


    const majorRealms = useMemo(() => {
        const realms: { name: string, firstGlobalIndex: number, subTiers: LevelData[] }[] = [];
        let currentMajorRealm = "";
        gameData.levels.forEach(level => {
            if (level.majorRealmName !== currentMajorRealm) {
                currentMajorRealm = level.majorRealmName;
                realms.push({ name: currentMajorRealm, firstGlobalIndex: level.globalIndex, subTiers: [] });
            }
            realms[realms.length - 1].subTiers.push(level);
        });
        return realms;
    }, [gameData.levels]);

    const [selectedMajorRealmName, setSelectedMajorRealmName] = useState<string>(majorRealms[0]?.name || '');
    const [selectedSubTierIndexState, setSelectedSubTierIndexState] = useState<number>(0);


    useEffect(() => {
        if (isAdmin) {
            setAllUsernamesState(getAllUsernames());
        }
    }, [isAdmin, getAllUsernames]);

    useEffect(() => {
        if (selectedUsername && isAdmin) {
            const playerData = loadPlayerDataForAdmin(selectedUsername);
            setSelectedPlayerData(playerData);
            if (playerData && gameData.levels[playerData.level]) {
                const currentLevelData = gameData.levels[playerData.level];
                setSelectedMajorRealmName(currentLevelData.majorRealmName);
                const realm = majorRealms.find(r => r.name === currentLevelData.majorRealmName);
                if (realm) {
                    const subTierIdxInRealm = realm.subTiers.findIndex(st => st.globalIndex === playerData.level);
                    setSelectedSubTierIndexState(subTierIdxInRealm >=0 ? subTierIdxInRealm : 0);
                }
            } else {
                 setSelectedMajorRealmName(majorRealms[0]?.name || '');
                 setSelectedSubTierIndexState(0);
            }
        } else {
            setSelectedPlayerData(null);
        }
    }, [selectedUsername, isAdmin, loadPlayerDataForAdmin, majorRealms, gameData.levels]);

    const handleDirectFieldChange = (field: keyof Player, value: string | number | null) => {
        if (!selectedPlayerData) return;
        let finalValue = value;
        if (typeof value === 'string' && (field === 'linhThach' || field === 'tuvi' || field === 'hp')) {
            finalValue = parseInt(value, 10) || 0;
        }
         if (field === 'sect' && value === "") finalValue = null; // Handle unsetting sect
        setSelectedPlayerData(prev => prev ? ({ ...prev, [field]: finalValue }) : null);
    };

    const handleBaseStatChange = (statKey: keyof BaseStats, value: string) => {
        if(!selectedPlayerData) return;
        const numericValue = parseFloat(value) || 0; 
        setSelectedPlayerData(prev => prev ? ({
            ...prev,
            baseStats: {
                ...prev.baseStats,
                [statKey]: numericValue,
            }
        }) : null);
    };
    
    const handleLevelChangeViaDropdowns = () => {
        if (!selectedPlayerData || !selectedMajorRealmName) return;
        const realm = majorRealms.find(r => r.name === selectedMajorRealmName);
        if (realm && realm.subTiers[selectedSubTierIndexState]) {
            const newGlobalLevelIndex = realm.subTiers[selectedSubTierIndexState].globalIndex;
            const newLevelData = gameData.levels[newGlobalLevelIndex];
            setSelectedPlayerData(prev => {
                if (!prev) return null;
                if (prev.level === newGlobalLevelIndex) return prev;
                return {
                    ...prev,
                    level: newGlobalLevelIndex,
                    tuvi: 0, 
                    currentMapId: newLevelData.mapId,
                }
            });
        }
    };
    
     useEffect(() => { 
        if(selectedPlayerData && selectedMajorRealmName !== undefined && selectedSubTierIndexState !== undefined) {
            handleLevelChangeViaDropdowns();
        }
    }, [selectedMajorRealmName, selectedSubTierIndexState, selectedPlayerData?.characterName]);

    const handleQuestDataChange = (key: keyof QuestProgressData, value: string) => { 
        if(!selectedPlayerData) return;
        const numericValue = parseInt(value, 10) || 0;
        setSelectedPlayerData(prev => prev ? ({
            ...prev,
            questData: {
                ...prev.questData,
                [key]: numericValue,
            }
        }) : null);
    };
    const handleClearPromoCode = (codeToClear: string) => { 
        if(!selectedPlayerData) return;
        setSelectedPlayerData(prev => prev ? ({
            ...prev,
            promoCodesUsed: prev.promoCodesUsed.filter(code => code !== codeToClear)
        }) : null);
    };
    const handleActivityUsageChange = (activityId: string, value: string) => { 
         if(!selectedPlayerData) return;
        const numericValue = parseInt(value, 10) || 0;
        setSelectedPlayerData(prev => prev ? ({
            ...prev,
            activityUsage: {
                ...prev.activityUsage,
                [activityId]: {
                    ...(prev.activityUsage[activityId] || { count: 0, lastResetDate: new Date().toISOString().split('T')[0] }),
                    count: numericValue,
                }
            }
        }) : null);
    };
    const handleResetActivityDate = (activityId: string) => { 
        if (!selectedPlayerData) return;
        setSelectedPlayerData(prev => {
            if (!prev) return null;
            const updatedActivityUsage = { ...prev.activityUsage };
            if (updatedActivityUsage[activityId]) {
                updatedActivityUsage[activityId] = {
                    ...updatedActivityUsage[activityId],
                    lastResetDate: "1970-01-01" 
                };
            } else { 
                 updatedActivityUsage[activityId] = { count: 0, lastResetDate: "1970-01-01" };
            }
            return { ...prev, activityUsage: updatedActivityUsage };
        });
    };

    const handleAddCongPhapToPlayer = () => {
        if (!selectedPlayerData || !addCongPhapId) return;
        const cpBase = itemDB[addCongPhapId];
        if (!cpBase || cpBase.type !== 'congPhap') {
            addLog(`Vật phẩm ${addCongPhapId} không phải là công pháp.`, 'text-red-400');
            return;
        }
        setSelectedPlayerData(prev => {
            if (!prev) return null;
            if (prev.congPhap.length >= 5) {
                addLog("Người chơi đã học đủ 5 công pháp.", "text-yellow-400");
                return prev;
            }
            if (prev.congPhap.some(cp => cp.id === cpBase.id)) {
                 addLog(`Người chơi đã học [${cpBase.name}] rồi.`, "text-yellow-400");
                return prev;
            }
            const newCongPhapInstance = createInventoryItemFromBase(cpBase) as InventoryItem; 
            addLog(`Đã thêm công pháp [${cpBase.name}] cho ${selectedUsername}. Lưu lại để áp dụng.`, 'text-blue-400');
            return { ...prev, congPhap: [...prev.congPhap, newCongPhapInstance] };
        });
    };

    const handleRemoveCongPhapFromPlayer = (cpInstanceId: string) => {
        if (!selectedPlayerData) return;
        setSelectedPlayerData(prev => {
            if (!prev) return null;
            const cpName = prev.congPhap.find(cp => cp.instanceId === cpInstanceId)?.name || 'Công pháp';
            addLog(`Đã xóa [${cpName}] khỏi danh sách đã học của ${selectedUsername}. Lưu lại để áp dụng.`, 'text-orange-400');
            return { ...prev, congPhap: prev.congPhap.filter(cp => cp.instanceId !== cpInstanceId) };
        });
    };

    const handleSavePlayerChanges = () => { 
        if (selectedUsername && selectedPlayerData && isAdmin) {
            // Recalculate sect title before saving if sect changed
            let finalPlayerData = {...selectedPlayerData};
            if (finalPlayerData.sect && gameData.sects[finalPlayerData.sect]) {
                const sectData = gameData.sects[finalPlayerData.sect];
                finalPlayerData.playerSectTitle = {
                    title: sectData.titleFormat.replace('{sectName}', sectData.name),
                    styleClass: sectData.titleStyleClass
                };
            } else if (!finalPlayerData.sect) {
                 finalPlayerData.playerSectTitle = null;
            }
            savePlayerDataForAdmin(selectedUsername, finalPlayerData);
            addLog(`Đã cập nhật dữ liệu cho người dùng: ${selectedUsername}`, 'text-green-500');
        }
    };
    const handleAddItemToPlayer = () => { 
        if (!selectedPlayerData || !selectedUsername || !addItemId || addItemQuantity <= 0) return;
        const itemBase = itemDB[addItemId];
        if (!itemBase) return;

        setSelectedPlayerData(prev => {
            if (!prev) return null;
            const newInventory = { ...prev.inventory };
            for (let i = 0; i < addItemQuantity; i++) {
                const newItem = createInventoryItemFromBase(itemBase);
                newInventory[newItem.instanceId] = newItem;
            }
            addLog(`Đã thêm ${addItemQuantity} x [${itemBase.name}] cho ${selectedUsername}. Lưu lại để áp dụng.`, 'text-blue-400');
            return { ...prev, inventory: newInventory };
        });
    };
    const handleRemoveItemFromPlayer = (instanceId: string) => { 
        if (!selectedPlayerData || !selectedUsername) return;
        setSelectedPlayerData(prev => {
            if (!prev) return null;
            const newInventory = { ...prev.inventory };
            const itemName = newInventory[instanceId]?.name || 'Vật phẩm không rõ';
            delete newInventory[instanceId];
            addLog(`Đã xóa [${itemName}] khỏi túi đồ của ${selectedUsername}. Lưu lại để áp dụng.`, 'text-orange-400');
            return { ...prev, inventory: newInventory };
        });
    };

     const handleSendAdminAnnouncement = () => {
        if (announcementMessage.trim()) {
            onSetGlobalAnnouncement(announcementMessage.trim());
            addLog(`Thông báo toàn cục đã được gửi (Admin): "${announcementMessage.trim()}"`, 'text-blue-400');
            setAnnouncementMessage('');
        }
    };

    if (!isAdmin) return null;
    const currentSubTiersForSelectedMajorRealm = majorRealms.find(r => r.name === selectedMajorRealmName)?.subTiers || [];
    const congPhapItems = Object.values(itemDB).filter(item => item.type === 'congPhap');

    return (
        <div className="mt-4 p-2 bg-gray-800 rounded-md shadow-lg text-xs">
            <h3 className="text-xl font-bold text-red-500 border-b border-red-700 pb-2 mb-3">Bảng Điều Khiển Admin</h3>
            
            <div className="mb-4">
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-300 mb-1">Chọn Người Dùng:</label>
                <select id="user-select" value={selectedUsername || ''} onChange={(e) => setSelectedUsername(e.target.value || null)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500">
                    <option value="">-- Chọn một người dùng --</option>
                    {allUsernamesState.map(username => (<option key={username} value={username}>{username}</option>))}
                </select>
            </div>

            {selectedPlayerData && (
                <div className="space-y-3 p-3 bg-gray-700 rounded">
                    <h4 className="text-lg font-semibold text-yellow-400">Quản Lý: {selectedPlayerData.characterName} (User: {selectedUsername})</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><label className="text-sm text-gray-300">Linh Thạch:</label><input type="number" value={selectedPlayerData.linhThach} onChange={(e) => handleDirectFieldChange('linhThach', e.target.value)} className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white" /></div>
                        <div><label className="text-sm text-gray-300">Tu Vi:</label><input type="number" value={selectedPlayerData.tuvi} onChange={(e) => handleDirectFieldChange('tuvi', e.target.value)} className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white" /></div>
                        <div><label className="text-sm text-gray-300">HP Hiện Tại:</label><input type="number" value={selectedPlayerData.hp} onChange={(e) => handleDirectFieldChange('hp', e.target.value)} className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white" /></div>
                        <div>
                            <label className="text-sm text-gray-300">Trạng Thái:</label>
                            <select value={selectedPlayerData.status} onChange={(e) => handleDirectFieldChange('status', e.target.value)} className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white">
                                <option value="normal">Bình thường</option><option value="meditating">Đang Tịnh Dưỡng</option><option value="exploring">Đang Thám Hiểm</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-sm text-gray-300">Tông Môn:</label>
                            <select value={selectedPlayerData.sect || ''} onChange={(e) => handleDirectFieldChange('sect', e.target.value)} className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white">
                                <option value="">Không có</option>
                                {Object.values(gameData.sects).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div> 
                        <label className="text-sm text-gray-300">Cảnh Giới Chính:</label>
                        <select value={selectedMajorRealmName} onChange={(e) => {setSelectedMajorRealmName(e.target.value); setSelectedSubTierIndexState(0);}}
                            className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white mb-1">
                            {majorRealms.map(realm => (<option key={realm.name} value={realm.name}>{realm.name}</option>))}
                        </select>
                        <label className="text-sm text-gray-300">Tiểu Cảnh Giới:</label>
                         <select value={selectedSubTierIndexState} onChange={(e) => setSelectedSubTierIndexState(parseInt(e.target.value))}
                            className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white" disabled={!selectedMajorRealmName}>
                            {currentSubTiersForSelectedMajorRealm.map((subTier, index) => (
                                <option key={subTier.globalIndex} value={index}>{subTier.subTierName} (Cấp QT: {subTier.globalIndex})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Cấp hiện tại: {gameData.levels[selectedPlayerData.level]?.name || 'Không rõ'}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-600"><h5 className="text-md font-semibold text-yellow-300 mb-1">Thuộc Tính Gốc (BaseStats)</h5>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            {(Object.keys(selectedPlayerData.baseStats) as Array<keyof BaseStats>).map(statKey => (
                                <div key={statKey}><label className="text-xs text-gray-300 capitalize">{statKey.replace('permanent','P.').replace('Percent',' %').replace('Rate',' Tỷ Lệ')}:</label>
                                <input type="number" step="0.01" value={selectedPlayerData.baseStats[statKey] || 0} onChange={e => handleBaseStatChange(statKey, e.target.value)} className="w-full p-0.5 bg-gray-600 border border-gray-500 rounded text-white text-xs"/></div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-600"><h5 className="text-md font-semibold text-yellow-300 mb-1">Tiến Độ Nhiệm Vụ</h5>
                        {Object.entries(selectedPlayerData.questData).map(([key, value]) => (
                             <div key={key} className="flex items-center gap-2 mb-0.5">
                                <label className="text-xs text-gray-300 w-28 truncate capitalize">{questKeyToVietnameseAdmin[key] || key}:</label>
                                <input type="number" value={value} onChange={e => handleQuestDataChange(key as keyof QuestProgressData, e.target.value)} className="flex-grow p-0.5 bg-gray-600 border border-gray-500 rounded text-white text-xs"/>
                            </div>
                        ))}
                    </div>
                    {selectedPlayerData.promoCodesUsed.length > 0 && <div className="mt-2 pt-2 border-t border-gray-600"><h5 className="text-md font-semibold text-yellow-300 mb-1">Giftcode Đã Dùng</h5> <div className="flex flex-wrap gap-1"> {selectedPlayerData.promoCodesUsed.map(code => (<button key={code} onClick={() => handleClearPromoCode(code)} className="text-xs bg-gray-500 hover:bg-red-500 px-1.5 py-0.5 rounded">{code} (Xóa)</button>))} </div></div>}
                     <div className="mt-2 pt-2 border-t border-gray-600">
                        <h5 className="text-md font-semibold text-yellow-300 mb-1">Lượt Hoạt Động (trong "ngày")</h5>
                        {Object.keys(activityIdToVietnameseAdmin).map((activityId) => {
                            const usage = selectedPlayerData.activityUsage[activityId] || { count: 0, lastResetDate: ''};
                            return (
                                <div key={activityId} className="grid grid-cols-3 items-center gap-1 mb-0.5">
                                    <label className="text-xs text-gray-300 truncate capitalize col-span-1">{activityIdToVietnameseAdmin[activityId] || activityId}:</label>
                                    <input type="number" value={usage.count} onChange={e => handleActivityUsageChange(activityId, e.target.value)} className="p-0.5 bg-gray-600 border border-gray-500 rounded text-white text-xs col-span-1"/>
                                    <button onClick={() => handleResetActivityDate(activityId)} className="text-blue-400 hover:text-blue-300 text-xs px-1 py-0.5 bg-gray-500 rounded col-span-1">Reset Ngày</button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-600"><h5 className="text-md font-semibold text-yellow-300 mb-1">Công Pháp Đã Học ({selectedPlayerData.congPhap.length}/5)</h5>
                        <div className="flex items-center gap-2 mb-1">
                            <select value={addCongPhapId} onChange={e => setAddCongPhapId(e.target.value)} className="flex-grow p-1 bg-gray-600 border border-gray-500 rounded text-white text-xs">
                                <option value="">-- Chọn Công Pháp --</option>
                                {congPhapItems.map(cp => <option key={cp.id} value={cp.id}>{cp.name} ({cp.rarity.name})</option>)}
                            </select>
                            <ActionButton onClick={handleAddCongPhapToPlayer} className="!py-1 !px-2 !mb-0 text-xs" fullWidth={false}>Thêm CP</ActionButton>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                            {selectedPlayerData.congPhap.map(cp => (
                                <ItemDisplay key={cp.instanceId} item={cp} showButton={
                                    <ActionButton onClick={() => handleRemoveCongPhapFromPlayer(cp.instanceId)} className="!py-0.5 !px-1.5 !mb-0 text-xs !bg-red-700 hover:!bg-red-600" fullWidth={false}>Xóa</ActionButton>
                                }/>
                            ))}
                        </div>
                    </div>

                     <div className="mt-2 pt-2 border-t border-gray-600">
                        <h5 className="text-md font-semibold text-yellow-300 mb-1">Thêm Vật Phẩm Vào Túi</h5>
                        <div className="flex items-center gap-2">
                            <select value={addItemId} onChange={(e) => setAddItemId(e.target.value)}
                                className="flex-grow p-1 bg-gray-600 border border-gray-500 rounded text-white text-xs">
                                {Object.values(itemDB).map(item => (<option key={item.id} value={item.id}>{item.name} ({item.rarity.name})</option>))}
                            </select>
                            <input type="number" value={addItemQuantity} min="1" onChange={(e) => setAddItemQuantity(Math.max(1, parseInt(e.target.value)))} 
                                className="w-16 p-1 bg-gray-600 border border-gray-500 rounded text-white"/>
                            <ActionButton onClick={handleAddItemToPlayer} className="!py-1 !px-2 !mb-0 text-xs" fullWidth={false}>Thêm</ActionButton>
                        </div>
                    </div>
                     <div className="mt-2 pt-2 border-t border-gray-600">
                        <h5 className="text-md font-semibold text-yellow-300 mb-1">Túi Đồ Của {selectedPlayerData.characterName} ({Object.keys(selectedPlayerData.inventory).length} vật phẩm)</h5>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                            {Object.values(selectedPlayerData.inventory).length === 0 && <p className="text-xs text-gray-400">Túi đồ trống.</p>}
                            {Object.values(selectedPlayerData.inventory)
                                .sort((a,b) => ALL_RARITIES_ORDERED.findIndex(r => r.name === b.rarity.name) - ALL_RARITIES_ORDERED.findIndex(r => r.name === a.rarity.name) || a.name.localeCompare(b.name))
                                .map(item => (
                                <ItemDisplay key={item.instanceId} item={item}
                                    showButton={ <ActionButton onClick={() => handleRemoveItemFromPlayer(item.instanceId)} className="!py-0.5 !px-1.5 !mb-0 text-xs !bg-red-700 hover:!bg-red-600" fullWidth={false}>Xóa</ActionButton> } />
                            ))}
                        </div>
                    </div>
                    <ActionButton onClick={handleSavePlayerChanges} className="!mt-4 !bg-green-600 hover:!bg-green-500">
                        Lưu Thay Đổi Cho Người Dùng Này
                    </ActionButton>
                </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-600">
                <h4 className="text-lg font-semibold text-yellow-300">Gửi Thông Báo Toàn Cục (Admin)</h4>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-0.5">Nội dung:</label>
                    <textarea value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} placeholder="Nhập nội dung..." rows={2}
                        className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500" />
                </div>
                <ActionButton onClick={handleSendAdminAnnouncement} className="!bg-blue-600 hover:!bg-blue-500 mt-2">Gửi Thông Báo</ActionButton>
            </div>
        </div>
    );
};

export default AdminPanel;