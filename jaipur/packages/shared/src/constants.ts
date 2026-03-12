// ============================================================
// 斋浦尔 (Jaipur) - 游戏常量
// ============================================================

import type { GoodType, TradeGoodType } from './types.js';

// ============================================================
// 牌组定义
// ============================================================

/** 各货物类型在牌组中的数量 */
export const DECK_COMPOSITION: Record<GoodType, number> = {
  DIAMOND: 6,
  GOLD: 6,
  SILVER: 6,
  CLOTH: 8,
  SPICE: 8,
  LEATHER: 10,
  CAMEL: 11,
};

/** 牌组总数 */
export const TOTAL_CARDS = 55;

// ============================================================
// 游戏规则常量
// ============================================================

/** 手牌上限 */
export const MAX_HAND_SIZE = 7;

/** 市场牌数量 */
export const MARKET_SIZE = 5;

/** 初始市场中的骆驼数量 */
export const INITIAL_MARKET_CAMELS = 3;

/** 初始手牌数量 */
export const INITIAL_HAND_SIZE = 5;

/** 骆驼王奖励分数 */
export const CAMEL_BONUS_SCORE = 5;

/** 交换操作最少牌数 */
export const MIN_EXCHANGE_COUNT = 2;

/** 高级货物出售最少数量 */
export const MIN_PREMIUM_SELL_COUNT = 2;

/** 触发游戏结束所需的空标记堆数量 */
export const EMPTY_TOKEN_PILES_TO_END = 3;

/** 赢得比赛所需的局数（三局两胜） */
export const ROUNDS_TO_WIN = 2;

/** 最大局数 */
export const MAX_ROUNDS = 3;

// ============================================================
// 货物标记分值（降序排列，栈顶为最高分）
// ============================================================

/** 各货物的分值标记堆 */
export const TOKEN_VALUES: Record<TradeGoodType, number[]> = {
  DIAMOND: [7, 7, 5, 5, 5],
  GOLD: [6, 6, 5, 5, 5],
  SILVER: [5, 5, 5, 5, 5],
  CLOTH: [5, 3, 3, 2, 2, 1, 1],
  SPICE: [5, 3, 3, 2, 2, 1, 1],
  LEATHER: [4, 3, 2, 1, 1, 1, 1, 1, 1],
};

// ============================================================
// 奖励标记
// ============================================================

/** 出售 3 张货物的奖励标记（使用前需洗混） */
export const BONUS_TOKENS_THREE: number[] = [3, 3, 2, 2, 2, 1, 1];

/** 出售 4 张货物的奖励标记（使用前需洗混） */
export const BONUS_TOKENS_FOUR: number[] = [6, 6, 5, 5, 4, 4];

/** 出售 5 张及以上货物的奖励标记（使用前需洗混） */
export const BONUS_TOKENS_FIVE: number[] = [10, 10, 9, 8, 8];

// ============================================================
// 货物显示配置
// ============================================================

/** 货物的显示名称 */
export const GOOD_NAMES: Record<GoodType, string> = {
  DIAMOND: '钻石',
  GOLD: '黄金',
  SILVER: '白银',
  CLOTH: '布料',
  SPICE: '香料',
  LEATHER: '皮革',
  CAMEL: '骆驼',
};

/** 货物的图标 */
export const GOOD_ICONS: Record<GoodType, string> = {
  DIAMOND: '💎',
  GOLD: '🥇',
  SILVER: '🥈',
  CLOTH: '🧵',
  SPICE: '🌶️',
  LEATHER: '🐂',
  CAMEL: '🐪',
};

/** 货物的主题色 */
export const GOOD_COLORS: Record<GoodType, string> = {
  DIAMOND: '#60a5fa',
  GOLD: '#fbbf24',
  SILVER: '#9ca3af',
  CLOTH: '#c084fc',
  SPICE: '#f87171',
  LEATHER: '#a3764f',
  CAMEL: '#d4a574',
};
