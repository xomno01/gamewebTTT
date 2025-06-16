import { Player, LevelData, ItemBonus, PlayerStats, GameData, InventoryItem, EquipmentSlot, BaseItem, BaseStats, GlobalConfigOverrides, ActiveBuff } from '../types';
import { GAME_DATA, ITEM_DB } from '../constants';

export function calculateTotalStats(player: Player): PlayerStats {
    const currentLevelData = GAME_DATA.levels[player.level];
    if (!currentLevelData) {
        console.error("Invalid player level, cannot find level data for index:", player.level);
        return {
            tuviBase: 1, 
            hp: player.baseStats.permanentHp || 1, 
            attack: player.baseStats.permanentAtk || 1, 
            defense: player.baseStats.permanentDef || 1,
            ...(player.baseStats as PlayerStats), 
        };
    }
    const levelBaseStats: PlayerStats = JSON.parse(JSON.stringify(currentLevelData.stats));
    const baseStatsForWorking: PlayerStats = player.baseStats as PlayerStats; 

    const workingStats: PlayerStats = {
        permanentAtk: baseStatsForWorking.permanentAtk || 0,
        permanentDef: baseStatsForWorking.permanentDef || 0,
        permanentHp: baseStatsForWorking.permanentHp || 0,
        luck: baseStatsForWorking.luck || 0,
        tuviRatePercent: baseStatsForWorking.tuviRatePercent || 0,
        
        tuviBase: levelBaseStats.tuviBase,
        hp: (levelBaseStats.hp || 0) + (baseStatsForWorking.permanentHp || 0),
        attack: (levelBaseStats.attack || 0) + (baseStatsForWorking.permanentAtk || 0),
        defense: (levelBaseStats.defense || 0) + (baseStatsForWorking.permanentDef || 0),

        attackPercent: 0,
        hpPercent: 0,
        defensePercent: 0,
        allStatsPercent: 0,
        
        critChance: levelBaseStats.critChance ?? baseStatsForWorking.critChance ?? 0,
        critDamage: levelBaseStats.critDamage ?? baseStatsForWorking.critDamage ?? 1.5,
        lifeSteal: levelBaseStats.lifeSteal ?? baseStatsForWorking.lifeSteal ?? 0,
        damageReduction: levelBaseStats.damageReduction ?? baseStatsForWorking.damageReduction ?? 0,
        dodgeChance: levelBaseStats.dodgeChance ?? baseStatsForWorking.dodgeChance ?? 0,
        accuracy: levelBaseStats.accuracy ?? baseStatsForWorking.accuracy ?? 0,
        linhThachFindPercent: levelBaseStats.linhThachFindPercent ?? baseStatsForWorking.linhThachFindPercent ?? 0,
        explorationEventChance: levelBaseStats.explorationEventChance ?? baseStatsForWorking.explorationEventChance ?? 0,
        negativeEffectResist: levelBaseStats.negativeEffectResist ?? baseStatsForWorking.negativeEffectResist ?? 0,
    };
    
    const sources: (ItemBonus | undefined)[] = [
        ...player.congPhap.map(cp => cp.bonus),
        ...Object.values(player.equipment).filter(item => item && item.bonus).map(item => {
            let itemBonus = JSON.parse(JSON.stringify(item!.bonus)) as ItemBonus;
            if (item!.refineLevel > 0) {
                for (const stat in itemBonus) {
                    const statKey = stat as keyof ItemBonus;
                    if (typeof itemBonus[statKey] === 'number') {
                       (itemBonus[statKey] as number) *= (1 + (item!.refineLevel * 0.1));
                    }
                }
            }
            return itemBonus;
        }),
        player.sect ? GAME_DATA.sects[player.sect]?.bonus : undefined,
        // Add active buffs
        ...(player.activeBuffs || [])
            .filter(buff => buff.expiresAt > Date.now())
            .map(buff => buff.effect)
    ];

    sources.forEach(sourceBonus => {
        if (sourceBonus) {
            for (const key in sourceBonus) {
                const bonusKey = key as keyof ItemBonus;
                const bonusValue = sourceBonus[bonusKey];

                if (typeof bonusValue === 'number') {
                    if (bonusKey in workingStats) {
                        if (['attackPercent', 'hpPercent', 'defensePercent', 'allStatsPercent', 'tuviRatePercent', 
                             'critChance', 'critDamage', 'lifeSteal', 'damageReduction', 'dodgeChance', 
                             'accuracy', 'luck', 'linhThachFindPercent', 'explorationEventChance', 
                             'negativeEffectResist'].includes(bonusKey as string)) {
                            (workingStats as any)[bonusKey] = ((workingStats as any)[bonusKey] || 0) + bonusValue;
                        } else if (['attack', 'hp', 'defense', 'permanentAtk', 'permanentDef', 'permanentHp'].includes(bonusKey as string)) { 
                             (workingStats as any)[bonusKey] = ((workingStats as any)[bonusKey] || 0) + bonusValue;
                        }
                    }
                }
            }
        }
    });
    
    workingStats.attack = Math.floor((workingStats.attack || 0) * (1 + (workingStats.attackPercent || 0) + (workingStats.allStatsPercent || 0)));
    workingStats.hp = Math.floor((workingStats.hp || 0) * (1 + (workingStats.hpPercent || 0) + (workingStats.allStatsPercent || 0)));
    workingStats.defense = Math.floor((workingStats.defense || 0) * (1 + (workingStats.defensePercent || 0) + (workingStats.allStatsPercent || 0)));
    
    Object.keys(workingStats).forEach(key => {
        const statKey = key as keyof PlayerStats;
        if (typeof workingStats[statKey] === 'number' && isNaN(workingStats[statKey] as number) ) {
            (workingStats[statKey] as any) = 0; 
        } else if (workingStats[statKey] === undefined && 
                   !['permanentAtk', 'permanentDef', 'permanentHp', 'luck', 'tuviRatePercent', 
                    'critChance', 'critDamage', 'dodgeChance', 'accuracy', 'linhThachFindPercent', 
                    'explorationEventChance', 'negativeEffectResist', 'attack', 'defense', 'hp', 
                    'lifeSteal', 'damageReduction', 'allStatsPercent', 'attackPercent', 
                    'defensePercent', 'hpPercent'].includes(statKey)) {
            if (statKey !== 'tuviBase') { 
                 (workingStats as any)[statKey] = 0;
            }
        }
    });

    return workingStats;
}

export function generateNewInstanceId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function createInventoryItem(itemBaseId: string, refineLevel = 0): InventoryItem | null {
    const baseItem = ITEM_DB[itemBaseId];
    if (!baseItem) return null;
    return {
        ...baseItem,
        instanceId: generateNewInstanceId(),
        refineLevel: refineLevel,
    };
}
export function createInventoryItemFromBase(itemBase: BaseItem, refineLevel = 0): InventoryItem {
    return {
        ...itemBase,
        instanceId: generateNewInstanceId(),
        refineLevel: refineLevel,
    };
}

export function countItemInInventory(inventory: Record<string, InventoryItem>, itemId: string): number {
    return Object.values(inventory).filter(item => item.id === itemId).length;
}

export function removeItemsFromInventory(inventory: Record<string, InventoryItem>, itemId: string, amount: number): Record<string, InventoryItem> {
    const updatedInventory = { ...inventory };
    let removedCount = 0;
    const keysToRemove: string[] = [];

    for (const instanceId in updatedInventory) {
        if (updatedInventory[instanceId].id === itemId) {
            keysToRemove.push(instanceId);
            removedCount++;
            if (removedCount >= amount) break;
        }
    }
    keysToRemove.forEach(key => delete updatedInventory[key]);
    return updatedInventory;
}