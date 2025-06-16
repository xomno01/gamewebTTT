
import { Rarity, BaseItem, GameData, ItemBonus, PlayerEquipment, EquipmentSlot, MapData, Player, LevelData, BaseRealmDefinition, SubTierDefinition, ItemType, SectData, PlayerStats, GlobalConfigOverrides, TalismanRecipe, BossData } from './types';

export const RARITY_LEVELS: Record<string, Rarity> = {
    COMMON: { name: 'Phàm Phẩm', colorClass: 'text-gray-400', borderColorClass: 'border-gray-500', borderColorValue: '#6b7280', weight: 1000 },
    UNCOMMON: { name: 'Tinh Phẩm', colorClass: 'text-green-400', borderColorClass: 'border-green-500', borderColorValue: '#22c55e', weight: 500 },
    RARE: { name: 'Tuyệt Phẩm Linh Bảo', colorClass: 'text-blue-400', borderColorClass: 'border-blue-500', borderColorValue: '#3b82f6', weight: 250 },
    EPIC: { name: 'Pháp Bảo', colorClass: 'text-purple-400', borderColorClass: 'border-purple-500', borderColorValue: '#a855f7', weight: 100 },
    LEGENDARY: { name: 'Tiên Bảo', colorClass: 'text-orange-400 font-medium', borderColorClass: 'border-orange-500', borderColorValue: '#f97316', weight: 40, animationClass: 'animate-pulse opacity-90' },
    MYTHIC: { name: 'Truyền Thuyết', colorClass: 'text-red-500 font-semibold', borderColorClass: 'border-red-600', borderColorValue: '#dc2626', weight: 10, animationClass: 'animate-bounce opacity-80' },
    DIVINE: { name: 'Thần Thoại', colorClass: 'text-pink-500 font-bold', borderColorClass: 'border-pink-600', borderColorValue: '#ec4899', weight: 4, animationClass: 'animate-ping opacity-75' },
    ANCIENT: { name: 'Thượng Cổ', colorClass: 'text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-purple-500 to-yellow-300 font-bold', borderColorClass: 'border-purple-600', borderColorValue: '#9333ea', bgColorClass:'bg-gradient-to-r from-gray-700 via-purple-900 to-gray-800', weight: 1, animationClass: 'animate-ancient-text brightness-110' },
    ULTIMATE: { name: 'Chí Tôn Viễn Cổ', colorClass: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-red-500 font-extrabold', borderColorClass: 'border-yellow-400 shadow-lg shadow-yellow-500/50', borderColorValue: '#facc15', bgColorClass: 'bg-gray-900', weight: 0.1, animationClass: 'animate-ultimate-text brightness-125' }
};
export const ALL_RARITIES_ORDERED = Object.values(RARITY_LEVELS).sort((a,b) => a.weight - b.weight); // Corrected: sort from most common to rarest by weight for index use

export const ITEM_TYPE_TRANSLATIONS: Record<ItemType | 'all', string> = {
    all: "Tất Cả Loại",
    equipment: "Trang Bị",
    consumable: "Tiêu Hao Chung",
    pill: "Đan Dược",
    congPhap: "Công Pháp",
    material: "Nguyên Liệu",
    talisman: "Thần Phù",
    offlineTicket: "Vé Offline",
};
export const ITEM_TYPES_FOR_FILTER: Array<ItemType | 'all'> = ['all', 'equipment', 'consumable', 'pill', 'congPhap', 'material', 'talisman', 'offlineTicket'];

export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = { weapon: "Vũ Khí", armor: "Giáp", necklace: "H.Liên", ring: "Nhẫn", pet: "Linh Thú", helmet: "Mũ", pants: "Quần", boots: "Giày", gloves: "Găng", bracer: "H.Chương", belt: "Đai", cape: "Áo Choàng" };
export const INITIAL_PLAYER_EQUIPMENT: PlayerEquipment = { weapon: null, armor: null, necklace: null, ring: null, pet: null, helmet: null, pants: null, boots: null, gloves: null, bracer: null, belt: null, cape: null };

const createEffectForPermanentStatPill = (statToBoost: keyof Player['baseStats'], amount: number, vietnameseName: string): BaseItem['effect'] => {
    return (p: Player, addLogFn) => {
        const currentVal = (p.baseStats[statToBoost] as number | undefined) || 0;
        (p.baseStats[statToBoost] as number) = currentVal + amount;
        addLogFn(`${vietnameseName} vĩnh viễn tăng ${amount}! Thuộc tính gốc đã được cải thiện.`, RARITY_LEVELS.LEGENDARY.colorClass);
        return `${vietnameseName} vĩnh viễn tăng ${amount}!`;
    };
};

export const ITEM_DB: Record<string, BaseItem> = {
    // Materials
    'cuong_hoa_thach': { id: 'cuong_hoa_thach', name: "Đá Cường Hóa", type: 'material', rarity: RARITY_LEVELS.UNCOMMON, description: "Đá dùng để cường hóa, nâng cấp sức mạnh trang bị." },
    'phu_chi': { id: 'phu_chi', name: "Phù Chỉ", type: 'material', rarity: RARITY_LEVELS.UNCOMMON, description: "Giấy đặc biệt, thấm đẫm linh khí, dùng để vẽ Thần Phù." },
    'yeu_huyet': { id: 'yeu_huyet', name: "Yêu Huyết", type: 'material', rarity: RARITY_LEVELS.RARE, description: "Tinh huyết của Yêu thú ngưng tụ, nguyên liệu không thể thiếu cho các loại luyện chế cao cấp." },
    'than_thiet': { id: 'than_thiet', name: "Thần Thiết", type: 'material', rarity: RARITY_LEVELS.LEGENDARY, description: "Kim loại cực hiếm, hấp thụ linh khí trời đất, rèn nên thần binh lợi khí." },
    'tinh_van_sa': { id: 'tinh_van_sa', name: "Tinh Vân Sa", type: 'material', rarity: RARITY_LEVELS.MYTHIC, description: "Cát bụi từ những vì sao vỡ nát, ẩn chứa sức mạnh vũ trụ sơ khai." },
    'linh_thao': { id: 'linh_thao', name: "Linh Thảo Bình Thường", type: 'material', rarity: RARITY_LEVELS.COMMON, description: "Loại linh thảo phổ biến nhất, dùng luyện đan dược cấp thấp." },
    'ngoc_髓': { id: 'ngoc_髓', name: "Ngọc Tủy", type: 'material', rarity: RARITY_LEVELS.RARE, description: "Phần tinh túy nhất của ngọc thạch ngàn năm, có thể khảm nạm hoặc dùng làm vật dẫn linh khí." },
    'huyet_tinh_thach': { id: 'huyet_tinh_thach', name: "Huyết Tinh Thạch", type: 'material', rarity: RARITY_LEVELS.EPIC, description: "Đá quý hiếm ngưng tụ từ huyết khí của cường giả, dùng trong các thuật pháp và luyện chế đặc thù." },
    'long_chi': { id: 'long_chi', name: "Long Chi", type: 'material', rarity: RARITY_LEVELS.LEGENDARY, description: "Vảy của Giao Long hoặc Chân Long, cứng như kim cương, là vật liệu phòng ngự tuyệt hảo." },
    'phuong_vu': { id: 'phuong_vu', name: "Phượng Vũ", type: 'material', rarity: RARITY_LEVELS.MYTHIC, description: "Lông vũ của Phượng Hoàng Thần Điểu, chứa đựng Hỏa linh khí thuần khiết và khả năng tái sinh." },
    'hon_don_khi': { id: 'hon_don_khi', name: "Hỗn Độn Khí", type: 'material', rarity: RARITY_LEVELS.ANCIENT, description: "Một luồng khí nguyên thủy từ thời khai thiên lập địa, cực kỳ khó tìm và có giá trị vô song." },
    'vo_cuc_tinh_thach': {id: 'vo_cuc_tinh_thach', name: "Vô Cực Tinh Thạch", type: 'material', rarity: RARITY_LEVELS.ULTIMATE, description: "Kết tinh của năng lượng vô cực, vật liệu chủ chốt để chế tạo Chí Tôn Pháp Bảo hoặc Thần Khí."},
    'co_dai_ban_do': {id: 'co_dai_ban_do', name: "Cổ Đại Bản Đồ", type: 'material', rarity: RARITY_LEVELS.DIVINE, description: "Bản đồ cổ xưa, nhuốm màu thời gian, ghi lại vị trí bí cảnh thượng cổ hoặc động phủ tiền nhân."},
    'boss_core_1': { id: 'boss_core_1', name: "Yêu Hạch Hạ Cấp", type: 'material', rarity: RARITY_LEVELS.RARE, description: "Yêu hạch từ boss cấp thấp, dùng cho luyện chế cơ bản." },
    'boss_core_2': { id: 'boss_core_2', name: "Yêu Hạch Trung Cấp", type: 'material', rarity: RARITY_LEVELS.EPIC, description: "Yêu hạch từ boss trung cấp, chứa nhiều linh lực hơn." },
    'boss_core_3': { id: 'boss_core_3', name: "Thần Hạch Sơ Cấp", type: 'material', rarity: RARITY_LEVELS.LEGENDARY, description: "Thần hạch từ boss mạnh, vật liệu quý giá." },


    // Equipment
    'hon_don_chi_nguyen': { id: 'hon_don_chi_nguyen', name: "Hỗn Độn Chi Nguyên", type: 'equipment', slot: 'weapon', rarity: RARITY_LEVELS.ULTIMATE, bonus: { attack: 99999, critChance: 0.2, critDamage: 1.0, lifeSteal: 0.1, accuracy: 0.3, luck: 0.1 }, description: "Vũ khí khai thiên, sức mạnh vô song." },
    'bat_hoang_giap': { id: 'bat_hoang_giap', name: "Bát Hoang Luyện Thần Giáp", type: 'equipment', slot: 'armor', rarity: RARITY_LEVELS.MYTHIC, bonus: { defense: 8000, hp: 20000, damageReduction: 0.05, dodgeChance: 0.05 }, description: "Chiến giáp tôi luyện từ Bát Hoang chi khí." },
    'chu_tuoc_huyet_ngoc': { id: 'chu_tuoc_huyet_ngoc', name: "Chu Tước Huyết Ngọc", type: 'equipment', slot: 'necklace', rarity: RARITY_LEVELS.DIVINE, bonus: { hp: 50000, attack: 2000, defense: 1000, luck: 0.05 }, description: "Ngọc bội hình Chu Tước, ẩn chứa sinh cơ." },
    'long_than_gioi': { id: 'long_than_gioi', name: "Long Thần Giới", type: 'equipment', slot: 'ring', rarity: RARITY_LEVELS.LEGENDARY, bonus: { attack: 4000, hp: 5000, critChance: 0.05, accuracy: 0.1 }, description: "Nhẫn chạm khắc Long Thần, tăng cường uy lực." },
    'hon_mang_thien_ma': { id: 'hon_mang_thien_ma', name: "Hồng Hoang Thiên Ma", type: 'equipment', slot: 'pet', rarity: RARITY_LEVELS.ANCIENT, bonus: { attack: 50000, hp: 30000, allStatsPercent: 0.1, critDamage: 0.5, linhThachFindPercent: 0.2 }, description: "Linh thú từ thời Hồng Hoang, sức mạnh kinh thiên." },
    'thien_de_mao': { id: 'thien_de_mao', name: "Thiên Đế Mão", type: 'equipment', slot: 'helmet', rarity: RARITY_LEVELS.MYTHIC, bonus: { defense: 4000, hp: 10000, accuracy: 0.05 }, description: "Mũ trụ của Thiên Đế, uy nghiêm vô hạn." },
    'dao_hoa_quyet_giay': { id: 'dao_hoa_quyet_giay', name: "Đạp Hư Quyết (Giày)", type: 'equipment', slot: 'boots', rarity: RARITY_LEVELS.LEGENDARY, bonus: { defense: 1000, hp: 4000, dodgeChance: 0.1 }, description: "Giày kết hợp với Đạp Hư Quyết, thân pháp ảo diệu." },
    'van_phap_bao_quan': { id: 'van_phap_bao_quan', name: "Vạn Pháp Bảo Quần", type: 'equipment', slot: 'pants', rarity: RARITY_LEVELS.EPIC, bonus: { defense: 1500, hp: 3000, dodgeChance: 0.03 }, description: "Quần thụng thêu Vạn Pháp trận đồ." },
    'than_anh_thu': { id: 'than_anh_thu', name: "Thần Ảnh Thủ", type: 'equipment', slot: 'gloves', rarity: RARITY_LEVELS.RARE, bonus: { attack: 500, critChance: 0.02, accuracy: 0.05 }, description: "Găng tay giúp ra đòn nhanh như ảo ảnh." },
    'cuu_u_ho_uyen': { id: 'cuu_u_ho_uyen', name: "Cửu U Hộ Uyển", type: 'equipment', slot: 'bracer', rarity: RARITY_LEVELS.EPIC, bonus: { defense: 1000, hpPercent: 0.03 }, description: "Hộ uyển từ Cửu U hàn thiết, phòng ngự tốt." },
    'thien_long_dai': { id: 'thien_long_dai', name: "Thiên Long Yêu Đái", type: 'equipment', slot: 'belt', rarity: RARITY_LEVELS.LEGENDARY, bonus: { hp: 10000, defensePercent: 0.03 }, description: "Đai lưng dệt từ gân Thiên Long." },
    'tinh_khong_phi_phong': { id: 'tinh_khong_phi_phong', name: "Tinh Không Phi Phong", type: 'equipment', slot: 'cape', rarity: RARITY_LEVELS.MYTHIC, bonus: { dodgeChance: 0.07, damageReduction: 0.03 }, description: "Áo choàng như bầu trời sao, ẩn hiện khó lường." },

    // Consumables & Pills
    'dai_huan_dan': { id: 'dai_huan_dan', name: "Đại Hoàn Đan", type: 'pill', rarity: RARITY_LEVELS.EPIC, effect: (p) => { p.tuvi = (p.tuvi || 0) + 50000; return "Tu vi tăng 50000"; }, description: "Đan dược giúp tăng mạnh tu vi." },
    'thien_nguyen_dan': { id: 'thien_nguyen_dan', name: "Thiên Nguyên Đan", type: 'pill', rarity: RARITY_LEVELS.LEGENDARY, effect: (p) => { p.tuvi = (p.tuvi || 0) + 500000; return "Tu vi tăng 500k!"; }, description: "Đan dược quý hiếm, đột phá tu vi." },
    'vo_thuong_than_dan': { id: 'vo_thuong_than_dan', name: "Vô Thượng Thần Đan", type: 'pill', rarity: RARITY_LEVELS.MYTHIC, effect: (p) => { p.tuvi = (p.tuvi || 0) + 2500000; return "Vô Thượng Thần Lực! Tu vi tăng vọt 2.5 triệu!";}, description: "Thần đan chứa đựng năng lượng tinh khiết, tu vi tăng mạnh."},
    'cuu_chuyen_kim_dan': { id: 'cuu_chuyen_kim_dan', name: "Cửu Chuyển Kim Đan", type: 'pill', rarity: RARITY_LEVELS.DIVINE, effect: (p) => { p.tuvi = (p.tuvi || 0) + 10000000; return "Kim Đan Cửu Chuyển! Tu vi tăng kinh người 10 triệu!";}, description: "Trải qua 9 lần luyện chế, đan này có thể nghịch thiên cải mệnh."},
    'hon_nguyen_thanh_dan': { id: 'hon_nguyen_thanh_dan', name: "Hỗn Nguyên Thánh Đan", type: 'pill', rarity: RARITY_LEVELS.ANCIENT, effect: (p) => { p.tuvi = (p.tuvi || 0) + 50000000; return "Thánh Đan Xuất Thế! Tu vi tăng khủng khiếp 50 triệu!";}, description: "Ngưng tụ từ Hỗn Nguyên khí, một viên đủ để người thường thành tiên."},
    'dai_dao_nguon_dan': { id: 'dai_dao_nguon_dan', name: "Đại Đạo Nguyên Đan", type: 'pill', rarity: RARITY_LEVELS.ULTIMATE, effect: (p) => { p.tuvi = (p.tuvi || 0) + 200000000; return "Đại Đạo Chi Lực! Tu vi tăng không thể tưởng tượng, 200 triệu!";}, description: "Chứa một tia Đại Đạo, giá trị vô song."},
    'luc_dao_dan': { id: 'luc_dao_dan', name: "Lực Đạo Đan", type: 'pill', rarity: RARITY_LEVELS.LEGENDARY, effect: createEffectForPermanentStatPill('permanentAtk', 100, "Công Lực"), description: "Vĩnh viễn tăng 100 Công Lực Gốc."},
    'the_chat_dan': { id: 'the_chat_dan', name: "Thể Chất Đan", type: 'pill', rarity: RARITY_LEVELS.LEGENDARY, effect: createEffectForPermanentStatPill('permanentHp', 500, "Sinh Lực"), description: "Vĩnh viễn tăng 500 Sinh Lực Gốc."},
    'can_cot_dan': { id: 'can_cot_dan', name: "Căn Cốt Đan", type: 'pill', rarity: RARITY_LEVELS.LEGENDARY, effect: createEffectForPermanentStatPill('permanentDef', 50, "Phòng Thủ"), description: "Vĩnh viễn tăng 50 Phòng Thủ Gốc."},
    'van_linh_qua': { id: 'van_linh_qua', name: "Vạn Linh Quả", type: 'consumable', rarity: RARITY_LEVELS.RARE, effect: (p) => { p.tuvi = (p.tuvi || 0) + 10000; return "Tu vi tăng 10000"; }, description: "Linh quả ngàn năm, tăng nhẹ tu vi." },
    
    've_tu_luyen_thoi_khong': {id: 've_tu_luyen_thoi_khong', name: "Vé Tu Luyện Thời Không", type: 'offlineTicket', rarity: RARITY_LEVELS.EPIC, description: "Kích hoạt 24 giờ tu luyện offline (tốc độ 1/3 online). Giá 10,000 LT.", effect: (p, addLogFn) => {
        p.offlineCultivationActiveUntil = Date.now() + 24 * 60 * 60 * 1000;
        addLogFn("Đã kích hoạt Vé Tu Luyện Thời Không! Tu vi sẽ được tự động tích lũy khi bạn offline trong 24 giờ tới (tốc độ 1/3).", RARITY_LEVELS.EPIC.colorClass);
        return "Vé Tu Luyện Thời Không đã được kích hoạt!";
    }},

    // Cong Phap
    'thien_pham_cong': { id: 'thien_pham_cong', name: "Thiên Phẩm Công Pháp Quyển", type: 'congPhap', rarity: RARITY_LEVELS.EPIC, bonus: { tuviRatePercent: 0.2, attackPercent: 0.05 }, description: "Công pháp Thiên Phẩm, tăng tốc tu luyện và công lực." },
    'hong_mong_quyet': { id: 'hong_mong_quyet', name: "Hồng Mông Quyết", type: 'congPhap', rarity: RARITY_LEVELS.MYTHIC, bonus: { allStatsPercent: 0.1, luck: 0.02 }, description: "Công pháp Hồng Mông, toàn diện mạnh mẽ." },
    'van_co_bat_huyet_than_cong': { id: 'van_co_bat_huyet_than_cong', name: "Vạn Cổ Bất Diệt Thần Công", type: 'congPhap', rarity: RARITY_LEVELS.DIVINE, bonus: { hpPercent: 0.2, damageReduction: 0.05, dodgeChance: 0.03 }, description: "Thần công phòng thủ, bất diệt bất hoại." },
    
    // Talismans (as distinct items)
    'cuong_luc_phu_item': { id: 'cuong_luc_phu_item', name: "Cường Lực Phù", type: 'talisman', rarity: RARITY_LEVELS.RARE, bonus: { attackPercent: 0.1 }, duration: 600, description: "Thần phù tăng cường công lực. Kéo dài 10 phút.", icon: "⚡" },
    'phong_ngu_phu_item': { id: 'phong_ngu_phu_item', name: "Phòng Ngự Phù", type: 'talisman', rarity: RARITY_LEVELS.RARE, bonus: { defensePercent: 0.1 }, duration: 600, description: "Thần phù tăng cường phòng thủ. Kéo dài 10 phút.", icon: "🛡️" },
    'ho_the_phu_item': { id: 'ho_the_phu_item', name: "Hộ Thể Phù", type: 'talisman', rarity: RARITY_LEVELS.EPIC, bonus: { damageReduction: 0.05, hpPercent: 0.05 }, duration: 900, description: "Thần phù bảo vệ cơ thể, giảm sát thương và tăng sinh lực. Kéo dài 15 phút.", icon: "💖" },
    'tat_phong_phu_item': { id: 'tat_phong_phu_item', name: "Tật Phong Phù", type: 'talisman', rarity: RARITY_LEVELS.EPIC, bonus: { dodgeChance: 0.1, tuviRatePercent: 0.05 }, duration: 1200, description: "Thần phù tăng tốc độ né tránh và tu luyện. Kéo dài 20 phút.", icon: "💨" },

};

export const BASE_REALM_DEFINITIONS: BaseRealmDefinition[] = [
    {
        majorRealmName: "Phàm Nhân", mapId: "sai_gon_tan_thu_city",
        baseTuviMax: 100,
        baseStats: { tuviBase: 1, hp: 50, attack: 5, defense: 1, critChance: 0.01, critDamage: 1.5, luck: 0.01, tuviRatePercent: 0 },
        subTiers: 9, 
        breakthroughChanceToNextRealm: 0.95,
    },
    {
        majorRealmName: "Luyện Khí", mapId: "that_huyen_mon_ngoai_vi",
        baseTuviMax: 1000, 
        baseStats: { tuviBase: 5, hp: 300, attack: 30, defense: 15, critChance: 0.03, critDamage: 1.5, luck: 0.01, tuviRatePercent: 0 },
        subTiers: 9,
        breakthroughChanceToNextRealm: 0.9,
    },
    {
        majorRealmName: "Trúc Cơ", mapId: "hoang_phong_coc_thi_luyen_dia",
        baseTuviMax: 10000, 
        baseStats: { tuviBase: 20, hp: 2000, attack: 200, defense: 100, critChance: 0.07, critDamage: 1.6, luck: 0.01, tuviRatePercent: 0 },
        subTiers: 9,
        breakthroughChanceToNextRealm: 0.8,
    },
    {
        majorRealmName: "Kim Đan", mapId: "huyet_sac_cam_dia",
        baseTuviMax: 100000, 
        baseStats: { tuviBase: 120, hp: 12000, attack: 1200, defense: 600, critChance: 0.15, critDamage: 1.8, luck: 0.01, tuviRatePercent: 0 },
        subTiers: [
            { name: "Sơ Kỳ", tuviMaxMultiplier: 1, statMultiplier: 1, breakthroughChance: 0.8 },
            { name: "Trung Kỳ", tuviMaxMultiplier: 1.8, statMultiplier: 1.3, breakthroughChance: 0.75 },
            { name: "Hậu Kỳ", tuviMaxMultiplier: 2.7, statMultiplier: 1.7, breakthroughChance: 0.7 },
            { name: "Đỉnh Phong", tuviMaxMultiplier: 3.5, statMultiplier: 2.2 }, 
        ],
        breakthroughChanceToNextRealm: 0.6,
    },
    {
        majorRealmName: "Nguyên Anh", mapId: "loan_tinh_hai_noi_hai",
        baseTuviMax: 1e6,
        baseStats: { tuviBase: 500, hp: 50000, attack: 5000, defense: 2500, critChance: 0.2, critDamage: 2.0, luck: 0.01, tuviRatePercent: 0 },
        subTiers: [ 
            { name: "Sơ Kỳ", tuviMaxMultiplier: 1, statMultiplier: 1, breakthroughChance: 0.6 },
            { name: "Trung Kỳ", tuviMaxMultiplier: 2, statMultiplier: 1.4, breakthroughChance: 0.55 },
            { name: "Hậu Kỳ", tuviMaxMultiplier: 3.5, statMultiplier: 1.9, breakthroughChance: 0.5 },
            { name: "Đỉnh Phong", tuviMaxMultiplier: 5, statMultiplier: 2.5 },
        ],
        breakthroughChanceToNextRealm: 0.3,
    },
     { // Example for higher tiers
        majorRealmName: "Hóa Thần", mapId: "loan_tinh_hai_noi_hai", // Placeholder map
        baseTuviMax: 5e6,
        baseStats: { tuviBase: 2000, hp: 200000, attack: 15000, defense: 8000, critChance: 0.25, critDamage: 2.5, luck: 0.02, tuviRatePercent: 0 },
        subTiers: [ { name: "Sơ Kỳ", tuviMaxMultiplier: 1, statMultiplier: 1, breakthroughChance: 0.3 }, { name: "Trung Kỳ", tuviMaxMultiplier: 2, statMultiplier: 1.4, breakthroughChance: 0.25 }, { name: "Hậu Kỳ", tuviMaxMultiplier: 3.5, statMultiplier: 1.9, breakthroughChance: 0.2 }, { name: "Đỉnh Phong", tuviMaxMultiplier: 5, statMultiplier: 2.5 }, ],
        breakthroughChanceToNextRealm: 0.1,
    },
    {
        majorRealmName: "Thánh Nhân", mapId: "thanh_gioi_ha_vuc",
        baseTuviMax: 1e15, 
        baseStats: { tuviBase: 50e9, hp: 50e12, attack: 500e9, defense: 350e9, critChance: 0.9, critDamage: 15, luck: 0.05, tuviRatePercent: 0.1 },
        subTiers: 33, 
        breakthroughChanceToNextRealm: 0.005, 
    },
    // ... Add definitions for Luyện Hư, Hợp Thể, Đại Thừa, Độ Kiếp, Tiên Realms etc. following the pattern.
];

function generateLevels(baseRealmDefs: BaseRealmDefinition[]): LevelData[] {
    const allLevels: LevelData[] = [];
    let globalIdx = 0;

    baseRealmDefs.forEach((realmDef) => {
        let currentRealmBaseTuvi = realmDef.baseTuviMax;
        let currentRealmBaseStats: PlayerStats = JSON.parse(JSON.stringify(realmDef.baseStats)); 

        if (typeof realmDef.subTiers === 'number') { 
            const numTiers = realmDef.subTiers;
            for (let i = 0; i < numTiers; i++) {
                const subTierName = `Tầng ${i + 1}`;
                const tuviMax = Math.floor(currentRealmBaseTuvi * (1 + i * 0.35 * (numTiers > 10 ? 0.3 : 1) )); // Scale less for many tiers
                const stats: PlayerStats = JSON.parse(JSON.stringify(currentRealmBaseStats));
                
                const statProgressionFactor = 1 + i * (numTiers > 10 ? 0.08 : 0.20); // Slower progression for many tiers
                stats.hp = Math.floor((currentRealmBaseStats.hp || 0) * statProgressionFactor);
                stats.attack = Math.floor((currentRealmBaseStats.attack || 0) * statProgressionFactor);
                stats.defense = Math.floor((currentRealmBaseStats.defense || 0) * statProgressionFactor);
                stats.tuviBase = Math.floor(currentRealmBaseStats.tuviBase * (1 + i * (numTiers > 10 ? 0.05 : 0.15)));
                
                allLevels.push({
                    globalIndex: globalIdx,
                    name: `${realmDef.majorRealmName} - ${subTierName}`,
                    majorRealmName: realmDef.majorRealmName,
                    subTierName: subTierName,
                    tuviMax,
                    stats,
                    breakthroughChance: (i === numTiers - 1) ? realmDef.breakthroughChanceToNextRealm : (0.95 - i * (numTiers > 10 ? 0.005 : 0.03)),
                    mapId: realmDef.mapId,
                });
                globalIdx++;
            }
        } else { 
            const subTiersArray = realmDef.subTiers as SubTierDefinition[]; 
            subTiersArray.forEach((subDef, subIdx) => {
                const tuviMax = Math.floor(currentRealmBaseTuvi * subDef.tuviMaxMultiplier);
                const stats: PlayerStats = JSON.parse(JSON.stringify(currentRealmBaseStats));
                
                stats.hp = Math.floor((currentRealmBaseStats.hp || 0) * subDef.statMultiplier);
                stats.attack = Math.floor((currentRealmBaseStats.attack || 0) * subDef.statMultiplier);
                stats.defense = Math.floor((currentRealmBaseStats.defense || 0) * subDef.statMultiplier);
                stats.tuviBase = Math.floor(currentRealmBaseStats.tuviBase * subDef.statMultiplier * 0.9);

                allLevels.push({
                    globalIndex: globalIdx,
                    name: `${realmDef.majorRealmName} - ${subDef.name}`,
                    majorRealmName: realmDef.majorRealmName,
                    subTierName: subDef.name,
                    tuviMax,
                    stats, 
                    breakthroughChance: (subIdx === subTiersArray.length - 1) ? realmDef.breakthroughChanceToNextRealm : subDef.breakthroughChance,
                    mapId: realmDef.mapId,
                });
                globalIdx++;
            });
        }
    });
    // Ensure at least one level exists if definitions are empty
    if (allLevels.length === 0) {
        allLevels.push({
            globalIndex: 0, name: "Phàm Nhân - Tầng 1", majorRealmName: "Phàm Nhân", subTierName: "Tầng 1",
            tuviMax: 100, stats: { tuviBase: 1, hp: 50, attack: 5, defense: 1 }, mapId: "sai_gon_tan_thu_city", breakthroughChance: 0.95
        });
    }
    return allLevels;
}

export const MAP_DATA: MapData[] = [
    { id: "sai_gon_tan_thu_city", name: "Sài Gòn Tân Thủ City", minLevelIndex: 0, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx < 9 ? 1.0 : 0.1) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Nơi bắt đầu của mọi tu tiên giả." },
    { id: "that_huyen_mon_ngoai_vi", name: "Thất Huyền Môn Ngoại Vi", minLevelIndex: 9, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx >= 9 && lvlIdx < 18 ? 1.0 : (lvlIdx < 9 ? 0.05 : 0.2)) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Vùng ven của một tông môn nhỏ." },
    { id: "hoang_phong_coc_thi_luyen_dia", name: "Hoàng Phong Cốc Thí Luyện Địa", minLevelIndex: 18, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx >=18 && lvlIdx < 27 ? 1.0: 0.2) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Địa điểm thí luyện của đệ tử Hoàng Phong Cốc." },
    { id: "huyet_sac_cam_dia", name: "Huyết Sắc Cấm Địa", minLevelIndex: 27, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx >=27 && lvlIdx < 31 ? 1.0: 0.2) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Nơi đầy rẫy nguy hiểm và cơ duyên." },
    { id: "loan_tinh_hai_noi_hai", name: "Loạn Tinh Hải Nội Hải", minLevelIndex: 31, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx >=31 && lvlIdx < 35 ? 1.0: 0.2) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Vùng biển hỗn loạn, ẩn chứa bí mật cổ xưa." },
    { id: "thanh_gioi_ha_vuc", name: "Thánh Giới Hạ Vực", minLevelIndex: 35, tuViYieldModifier: (lvlIdx, pStats, overrides) => ((lvlIdx >= 35 ? 1.0 : 0.01) * (overrides.GLOBAL_TUVI_RATE_MULTIPLIER || 1)), description: "Vùng đất của các Thánh Nhân sơ nhập." },
];

const SECTS_DATA: Record<string, SectData> = {
    'van_kiem_tong': { id: 'van_kiem_tong', name: "Vạn Kiếm Tông", bonus: { attackPercent: 0.1, accuracy: 0.05, permanentAtk: 10 }, desc: "+10% Công Lực, +5% Chính Xác, +10 Công Lực Gốc", titleFormat: "Đệ Tử Vạn Kiếm Tông", titleStyleClass: "bg-blue-600 px-1 rounded text-white text-xs" },
    'huyen_dan_cac': { id: 'huyen_dan_cac', name: "Huyền Đan Các", bonus: { tuviRatePercent: 0.2, luck: 0.01, permanentHp: 50 }, desc: "+20% Tốc Độ Tu Luyện, +1% May Mắn, +50 HP Gốc", titleFormat: "Đan Sư Huyền Đan Các", titleStyleClass: "bg-green-600 px-1 rounded text-white text-xs" },
    'u_la_dien': { id: 'u_la_dien', name: "U La Điện", bonus: { critChance: 0.05, critDamage: 0.1 }, desc: "+5% Bạo Kích, +10% ST Bạo Kích", titleFormat: "Ma Tu U La Điện", titleStyleClass: "bg-purple-700 px-1 rounded text-white text-xs" },
    'tieu_dao_phai': { id: 'tieu_dao_phai', name: "Tiêu Dao Phái", bonus: { dodgeChance: 0.07, tuviRatePercent: 0.1 }, desc: "+7% Né Tránh, +10% Tốc Độ Tu Luyện", titleFormat: "Tán Tu Tiêu Dao Phái", titleStyleClass: "bg-teal-500 px-1 rounded text-white text-xs" },
    'thien_ma_cung': { id: 'thien_ma_cung', name: "Thiên Ma Cung", bonus: { lifeSteal: 0.03, attackPercent: 0.05, defensePercent: -0.02 }, desc: "+3% Hút Máu, +5% Công Lực, -2% Phòng Thủ", titleFormat: "Điện Chủ Thiên Ma Cung", titleStyleClass: "bg-red-700 px-1 rounded text-white text-xs" },
};

export const initialGlobalConfigOverrides: GlobalConfigOverrides = {
    GLOBAL_TUVI_RATE_MULTIPLIER: 1,
    GACHA_COST_MULTIPLIER: 1,
    EXPLORATION_LT_GAIN_MULTIPLIER: 1,
    BOSS_REWARD_MULTIPLIER: 1,
};


const talismanRecipes: TalismanRecipe[] = [
    { id: 'cuong_luc_phu_recipe', name: "Cường Lực Phù", talismanItemId: 'cuong_luc_phu_item', desc: "Tăng 10% Công Lực trong 10 phút.", rarity: RARITY_LEVELS.RARE, materials: { 'phu_chi': 5, 'yeu_huyet': 1 } },
    { id: 'phong_ngu_phu_recipe', name: "Phòng Ngự Phù", talismanItemId: 'phong_ngu_phu_item', desc: "Tăng 10% Phòng Thủ trong 10 phút.", rarity: RARITY_LEVELS.RARE, materials: { 'phu_chi': 5, 'ngoc_髓': 1 } },
    { id: 'ho_the_phu_recipe', name: "Hộ Thể Phù", talismanItemId: 'ho_the_phu_item', desc: "Giảm 5% S.Thương, tăng 5% HP trong 15 phút.", rarity: RARITY_LEVELS.EPIC, materials: { 'phu_chi': 10, 'huyet_tinh_thach': 2, 'linh_thao': 5 } },
    { id: 'tat_phong_phu_recipe', name: "Tật Phong Phù", talismanItemId: 'tat_phong_phu_item', desc: "Tăng 10% Né Tránh, 5% Tốc Độ Tu Vi trong 20 phút.", rarity: RARITY_LEVELS.EPIC, materials: { 'phu_chi': 10, 'phuong_vu': 1, 'yeu_huyet': 3 } },
];

const BOSS_LIST: BossData[] = [
    { id: 'bo_phap_lang_vuong', name: "Bạo Pháp Lang Vương", description: "Sói đầu đàn hung bạo, quen dùng phép thuật gió.", levelRequirement: 5, stats: { hp: 5000, attack: 250, defense: 100, critChance: 0.1, critDamage: 1.6, tuviBase: 0 }, rarity: RARITY_LEVELS.RARE, rewards: { linhThachMin: 500, linhThachMax: 1500, itemDrops: [{itemId: 'yeu_huyet', minAmount: 1, maxAmount:3, chance: 0.5}, {itemId: 'boss_core_1', minAmount: 1, maxAmount:1, chance: 0.8}], tuViGain: 1000 }, dailyAttemptLimit: 5 },
    { id: 'hac_nguu_ma_than', name: "Hắc Ngưu Ma Thân", description: "Trâu đen khổng lồ với lớp da cứng như sắt.", levelRequirement: 10, stats: { hp: 12000, attack: 350, defense: 500, critChance: 0.05, critDamage: 1.5, tuviBase: 0 }, rarity: RARITY_LEVELS.RARE, rewards: { linhThachMin: 1000, linhThachMax: 2500, itemDrops: [{itemId: 'cuong_hoa_thach', minAmount: 3, maxAmount:5, chance: 0.7}, {itemId: 'boss_core_1', minAmount: 1, maxAmount:2, chance: 0.9}], tuViGain: 2500 }, dailyAttemptLimit: 5 },
    { id: 'huyet_sac_chu_lau', name: "Huyết Sắc Chu Lâu", description: "Nhện độc khổng lồ, giăng tơ máu.", levelRequirement: 15, stats: { hp: 20000, attack: 600, defense: 300, accuracy: 0.1, dodgeChance: 0.1, tuviBase: 0 }, rarity: RARITY_LEVELS.EPIC, rewards: { linhThachMin: 2000, linhThachMax: 5000, itemDrops: [{itemId: 'huyet_tinh_thach', minAmount: 1, maxAmount:2, chance: 0.4}, {itemId: 'boss_core_2', minAmount: 1, maxAmount:1, chance: 0.7}], tuViGain: 5000 }, dailyAttemptLimit: 3 },
    { id: 'kim_dan_dao_nhan', name: "Kim Đan Đạo Nhân", description: "Một tu sĩ Kim Đan kỳ lạc lối, pháp bảo vô song.", levelRequirement: 27, stats: { hp: 50000, attack: 2000, defense: 1200, critChance: 0.2, critDamage: 2.0, tuviBase: 0 }, rarity: RARITY_LEVELS.EPIC, rewards: { linhThachMin: 5000, linhThachMax: 10000, itemDrops: [{itemId: 'thien_pham_cong', minAmount: 1, maxAmount:1, chance: 0.05}, {itemId: 'boss_core_2', minAmount: 1, maxAmount:2, chance: 0.8}, {itemId: 'ngoc_髓', minAmount: 2, maxAmount: 5, chance: 0.6}], tuViGain: 20000 }, dailyAttemptLimit: 3 },
    { id: 'nguyen_anh_lao_to', name: "Nguyên Anh Lão Tổ", description: "Lão quái Nguyên Anh, thần thông quảng đại.", levelRequirement: 31, stats: { hp: 250000, attack: 8000, defense: 5000, critChance: 0.25, critDamage: 2.5, tuviBase: 0 }, rarity: RARITY_LEVELS.LEGENDARY, rewards: { linhThachMin: 15000, linhThachMax: 30000, itemDrops: [{itemId: 'long_than_gioi', minAmount: 1, maxAmount:1, chance: 0.02}, {itemId: 'boss_core_3', minAmount: 1, maxAmount:1, chance: 0.7}, {itemId: 'thien_nguyen_dan', minAmount: 1, maxAmount:1, chance: 0.1}], tuViGain: 100000 }, dailyAttemptLimit: 2 },
    { id: 'hoa_than_cu_ma', name: "Hóa Thần Cự Ma", description: "Ma đầu Hóa Thần, hủy thiên diệt địa.", levelRequirement: 35, stats: { hp: 1000000, attack: 25000, defense: 15000, critChance: 0.3, critDamage: 3.0, tuviBase: 0 }, rarity: RARITY_LEVELS.MYTHIC, rewards: { linhThachMin: 50000, linhThachMax: 100000, itemDrops: [{itemId: 'bat_hoang_giap', minAmount: 1, maxAmount:1, chance: 0.01}, {itemId: 'boss_core_3', minAmount: 1, maxAmount:2, chance: 0.9}, {itemId: 'vo_thuong_than_dan', minAmount: 1, maxAmount:1, chance: 0.05}], tuViGain: 500000 }, dailyAttemptLimit: 1 },
    // Add 9 more bosses to reach 15.
    { id: 'phong_linh_dieu', name: "Phong Linh Điểu", description: "Chim thần linh hoạt, điều khiển gió lốc.", levelRequirement: 8, stats: { hp: 8000, attack: 300, defense: 150, dodgeChance: 0.2, tuviBase: 0 }, rarity: RARITY_LEVELS.RARE, rewards: { linhThachMin: 800, linhThachMax: 2000, itemDrops: [{itemId: 'phu_chi', minAmount: 5, maxAmount:10, chance: 0.6}, {itemId: 'boss_core_1', minAmount: 1, maxAmount:1, chance: 0.85}], tuViGain: 1800 }, dailyAttemptLimit: 5 },
    { id: 'thach_giap_quy', name: "Thạch Giáp Quy", description: "Rùa đá cổ thụ, phòng ngự cực cao.", levelRequirement: 12, stats: { hp: 25000, attack: 200, defense: 1000, damageReduction: 0.1, tuviBase: 0 }, rarity: RARITY_LEVELS.RARE, rewards: { linhThachMin: 1200, linhThachMax: 3000, itemDrops: [{itemId: 'cuong_hoa_thach', minAmount: 4, maxAmount:7, chance: 0.75}, {itemId: 'boss_core_1', minAmount: 1, maxAmount:2, chance: 0.9}], tuViGain: 3000 }, dailyAttemptLimit: 4 },
    { id: 'liet_hoa_su', name: "Liệt Hỏa Sư", description: "Sư tử rực lửa, thiêu đốt mọi thứ.", levelRequirement: 18, stats: { hp: 30000, attack: 800, defense: 400, critDamage: 1.8, tuviBase: 0 }, rarity: RARITY_LEVELS.EPIC, rewards: { linhThachMin: 3000, linhThachMax: 6000, itemDrops: [{itemId: 'yeu_huyet', minAmount: 2, maxAmount:4, chance: 0.5}, {itemId: 'boss_core_2', minAmount: 1, maxAmount:1, chance: 0.75}], tuViGain: 8000 }, dailyAttemptLimit: 3 },
    { id: 'bang_hon_ma_xa', name: "Băng Hồn Ma Xà", description: "Rắn ma băng giá, hơi thở đóng băng vạn vật.", levelRequirement: 22, stats: { hp: 40000, attack: 1200, defense: 600, negativeEffectResist: 0.2, tuviBase: 0 }, rarity: RARITY_LEVELS.EPIC, rewards: { linhThachMin: 4000, linhThachMax: 8000, itemDrops: [{itemId: 'huyet_tinh_thach', minAmount: 1, maxAmount:3, chance: 0.45}, {itemId: 'boss_core_2', minAmount: 1, maxAmount:1, chance: 0.8}], tuViGain: 12000 }, dailyAttemptLimit: 3 },
    { id: 'than_kien_hoang', name: "Thần Kiếm Hoàng", description: "Hoàng giả kiếm tu, kiếm ý kinh người.", levelRequirement: 30, stats: { hp: 100000, attack: 5000, defense: 3000, accuracy: 0.2, critChance: 0.25, tuviBase: 0 }, rarity: RARITY_LEVELS.LEGENDARY, rewards: { linhThachMin: 10000, linhThachMax: 25000, itemDrops: [{itemId: 'than_thiet', minAmount: 1, maxAmount:2, chance: 0.1}, {itemId: 'boss_core_3', minAmount: 1, maxAmount:1, chance: 0.75}, {itemId: 'luc_dao_dan', minAmount:1, maxAmount:1, chance:0.03}], tuViGain: 50000 }, dailyAttemptLimit: 2 },
    { id: 'thien_co_than_lau', name: "Thiên Cơ Thần Lâu", description: "Khôi lỗi cổ đại, ẩn chứa vô số cơ quan.", levelRequirement: 33, stats: { hp: 500000, attack: 15000, defense: 10000, damageReduction: 0.15, tuviBase: 0 }, rarity: RARITY_LEVELS.MYTHIC, rewards: { linhThachMin: 30000, linhThachMax: 70000, itemDrops: [{itemId: 'tinh_van_sa', minAmount: 1, maxAmount:1, chance: 0.05}, {itemId: 'boss_core_3', minAmount: 1, maxAmount:2, chance: 0.85}, {itemId: 'can_cot_dan', minAmount:1,maxAmount:1, chance: 0.02}], tuViGain: 200000 }, dailyAttemptLimit: 1 },
];

// Convert array to Record for easier lookup
const BOSS_DATA_RECORD: Record<string, BossData> = {};
BOSS_LIST.forEach(boss => {
    BOSS_DATA_RECORD[boss.id] = boss;
});

export const GAME_DATA: GameData = {
    baseRealmDefinitions: BASE_REALM_DEFINITIONS,
    levels: generateLevels(BASE_REALM_DEFINITIONS),
    sects: SECTS_DATA,
    quests: [
        { id: 'q_gacha_10', desc: 'Quay Tụ Bảo Các 10 lần', target: 10, key: 'gachaCount', reward: { linhThach: 5000 } },
        { id: 'q_explore_5', desc: 'Thám hiểm 5 lần (bất kỳ)', target: 5, key: 'exploreCount', reward: { item: ITEM_DB['dai_huan_dan'] } },
        { id: 'q_refine_1', desc: 'Cường hóa trang bị 1 lần', target: 1, key: 'refineCount', reward: { item: ITEM_DB['cuong_hoa_thach'], amount: 5 } },
        { id: 'q_kill_10_monsters', desc: 'Tiêu diệt 10 yêu thú (thám hiểm)', target: 10, key: 'monstersKilled', reward: { linhThach: 3000, item: ITEM_DB['yeu_huyet'], amount: 2 } },
        { id: 'q_reach_level_X', desc: 'Đạt cảnh giới Trúc Cơ Tầng 1 (Cấp QT: 18)', target: 18, key: 'breakthroughCount', reward: { linhThach: 10000, item: ITEM_DB['can_cot_dan'] } },
        { id: 'q_kill_3_bosses', desc: 'Khiêu chiến thành công 3 Boss bất kỳ', target: 3, key: 'bossesKilled', reward: { linhThach: 20000, item: ITEM_DB['thien_nguyen_dan'], amount: 1 } },
    ],
    talismanRecipes: talismanRecipes,
    maps: MAP_DATA,
    bosses: BOSS_DATA_RECORD,
};
