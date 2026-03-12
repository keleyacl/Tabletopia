// ============================================================
// 璀璨宝石·对决 (Splendor Duel) - 完整卡牌数据
// ============================================================
// 根据桌游规则自动生成，共 63 张卡牌
// Level 1: 25 张（低费用，0-1分，0-1皇冠）
// Level 2: 23 张（中等费用，1-3分，0-2皇冠）
// Level 3: 15 张（高费用，3-5分，1-3皇冠）
// ============================================================

import { Card, CardAbility, GemType } from './types.js';

// ============================================================
// Level 1 卡牌（25张）
// 特点：低费用（1-3宝石），0-1分，0-1皇冠
// 能力分布：TakeToken, TakePrivilege 为主
// ============================================================
export const LEVEL_1_CARDS: Card[] = [
  // --- 白色 bonus 卡牌 (5张) ---
  {
    id: 'L1-W01',
    level: 1,
    cost: { [GemType.Blue]: 1, [GemType.Green]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.White,
    ability: null,
  },
  {
    id: 'L1-W02',
    level: 1,
    cost: { [GemType.Blue]: 2 },
    points: 0,
    crowns: 1,
    bonus: GemType.White,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L1-W03',
    level: 1,
    cost: { [GemType.Red]: 1, [GemType.Black]: 1, [GemType.Green]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.White,
    ability: null,
  },
  {
    id: 'L1-W04',
    level: 1,
    cost: { [GemType.Blue]: 1, [GemType.Black]: 2 },
    points: 1,
    crowns: 0,
    bonus: GemType.White,
    ability: null,
  },
  {
    id: 'L1-W05',
    level: 1,
    cost: { [GemType.Green]: 2, [GemType.Blue]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.White,
    ability: CardAbility.TakePrivilege,
  },

  // --- 蓝色 bonus 卡牌 (5张) ---
  {
    id: 'L1-B01',
    level: 1,
    cost: { [GemType.White]: 1, [GemType.Green]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Blue,
    ability: null,
  },
  {
    id: 'L1-B02',
    level: 1,
    cost: { [GemType.White]: 2 },
    points: 0,
    crowns: 1,
    bonus: GemType.Blue,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L1-B03',
    level: 1,
    cost: { [GemType.White]: 1, [GemType.Red]: 1, [GemType.Black]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Blue,
    ability: null,
  },
  {
    id: 'L1-B04',
    level: 1,
    cost: { [GemType.White]: 2, [GemType.Green]: 1 },
    points: 1,
    crowns: 0,
    bonus: GemType.Blue,
    ability: null,
  },
  {
    id: 'L1-B05',
    level: 1,
    cost: { [GemType.Red]: 2, [GemType.White]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Blue,
    ability: CardAbility.TakePrivilege,
  },

  // --- 绿色 bonus 卡牌 (5张) ---
  {
    id: 'L1-G01',
    level: 1,
    cost: { [GemType.Red]: 1, [GemType.Blue]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L1-G02',
    level: 1,
    cost: { [GemType.Black]: 2 },
    points: 0,
    crowns: 1,
    bonus: GemType.Green,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L1-G03',
    level: 1,
    cost: { [GemType.White]: 1, [GemType.Blue]: 1, [GemType.Red]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L1-G04',
    level: 1,
    cost: { [GemType.Black]: 1, [GemType.Red]: 2 },
    points: 1,
    crowns: 0,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L1-G05',
    level: 1,
    cost: { [GemType.White]: 2, [GemType.Black]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Green,
    ability: CardAbility.TakePrivilege,
  },

  // --- 红色 bonus 卡牌 (5张) ---
  {
    id: 'L1-R01',
    level: 1,
    cost: { [GemType.Black]: 1, [GemType.White]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L1-R02',
    level: 1,
    cost: { [GemType.Green]: 2 },
    points: 0,
    crowns: 1,
    bonus: GemType.Red,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L1-R03',
    level: 1,
    cost: { [GemType.Blue]: 1, [GemType.Green]: 1, [GemType.Black]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L1-R04',
    level: 1,
    cost: { [GemType.Green]: 2, [GemType.White]: 1 },
    points: 1,
    crowns: 0,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L1-R05',
    level: 1,
    cost: { [GemType.Blue]: 2, [GemType.Red]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Red,
    ability: CardAbility.TakePrivilege,
  },

  // --- 黑色 bonus 卡牌 (5张) ---
  {
    id: 'L1-K01',
    level: 1,
    cost: { [GemType.Green]: 1, [GemType.Red]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Black,
    ability: null,
  },
  {
    id: 'L1-K02',
    level: 1,
    cost: { [GemType.Red]: 2 },
    points: 0,
    crowns: 1,
    bonus: GemType.Black,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L1-K03',
    level: 1,
    cost: { [GemType.White]: 1, [GemType.Blue]: 1, [GemType.Green]: 1 },
    points: 0,
    crowns: 0,
    bonus: GemType.Black,
    ability: null,
  },
  {
    id: 'L1-K04',
    level: 1,
    cost: { [GemType.White]: 1, [GemType.Blue]: 2 },
    points: 1,
    crowns: 0,
    bonus: GemType.Black,
    ability: null,
  },
  {
    id: 'L1-K05',
    level: 1,
    cost: { [GemType.Green]: 1, [GemType.Black]: 2 },
    points: 0,
    crowns: 0,
    bonus: GemType.Black,
    ability: CardAbility.TakePrivilege,
  },
];

// ============================================================
// Level 2 卡牌（23张）
// 特点：中等费用（3-6宝石），1-3分，0-2皇冠
// 能力分布：ExtraTurn, CopyColor, TakeToken 为主
// ============================================================
export const LEVEL_2_CARDS: Card[] = [
  // --- 白色 bonus 卡牌 (4张) ---
  {
    id: 'L2-W01',
    level: 2,
    cost: { [GemType.Blue]: 2, [GemType.Green]: 2, [GemType.Red]: 1 },
    points: 1,
    crowns: 1,
    bonus: GemType.White,
    ability: null,
  },
  {
    id: 'L2-W02',
    level: 2,
    cost: { [GemType.Blue]: 3, [GemType.Black]: 2 },
    points: 2,
    crowns: 0,
    bonus: GemType.White,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L2-W03',
    level: 2,
    cost: { [GemType.Green]: 2, [GemType.Red]: 2, [GemType.Black]: 1 },
    points: 1,
    crowns: 1,
    bonus: GemType.White,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L2-W04',
    level: 2,
    cost: { [GemType.Blue]: 3, [GemType.Green]: 1, [GemType.Pearl]: 1 },
    points: 2,
    crowns: 2,
    bonus: GemType.White,
    ability: null,
  },

  // --- 蓝色 bonus 卡牌 (4张) ---
  {
    id: 'L2-B01',
    level: 2,
    cost: { [GemType.White]: 2, [GemType.Green]: 1, [GemType.Black]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Blue,
    ability: null,
  },
  {
    id: 'L2-B02',
    level: 2,
    cost: { [GemType.White]: 3, [GemType.Green]: 2 },
    points: 2,
    crowns: 0,
    bonus: GemType.Blue,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L2-B03',
    level: 2,
    cost: { [GemType.White]: 2, [GemType.Red]: 1, [GemType.Black]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Blue,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L2-B04',
    level: 2,
    cost: { [GemType.White]: 2, [GemType.Red]: 2, [GemType.Pearl]: 1 },
    points: 2,
    crowns: 2,
    bonus: GemType.Blue,
    ability: null,
  },

  // --- 绿色 bonus 卡牌 (5张) ---
  {
    id: 'L2-G01',
    level: 2,
    cost: { [GemType.White]: 1, [GemType.Blue]: 2, [GemType.Red]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L2-G02',
    level: 2,
    cost: { [GemType.Black]: 3, [GemType.Red]: 2 },
    points: 2,
    crowns: 0,
    bonus: GemType.Green,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L2-G03',
    level: 2,
    cost: { [GemType.Blue]: 2, [GemType.Black]: 2, [GemType.White]: 1 },
    points: 1,
    crowns: 1,
    bonus: GemType.Green,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L2-G04',
    level: 2,
    cost: { [GemType.Black]: 3, [GemType.Blue]: 1, [GemType.Pearl]: 1 },
    points: 2,
    crowns: 2,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L2-G05',
    level: 2,
    cost: { [GemType.White]: 3, [GemType.Blue]: 2, [GemType.Red]: 1 },
    points: 3,
    crowns: 0,
    bonus: GemType.Green,
    ability: null,
  },

  // --- 红色 bonus 卡牌 (5张) ---
  {
    id: 'L2-R01',
    level: 2,
    cost: { [GemType.White]: 2, [GemType.Blue]: 1, [GemType.Black]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L2-R02',
    level: 2,
    cost: { [GemType.Green]: 3, [GemType.White]: 2 },
    points: 2,
    crowns: 0,
    bonus: GemType.Red,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L2-R03',
    level: 2,
    cost: { [GemType.Green]: 2, [GemType.Black]: 1, [GemType.Blue]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Red,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L2-R04',
    level: 2,
    cost: { [GemType.Green]: 2, [GemType.Black]: 2, [GemType.Pearl]: 1 },
    points: 2,
    crowns: 2,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L2-R05',
    level: 2,
    cost: { [GemType.Blue]: 3, [GemType.Black]: 2, [GemType.White]: 1 },
    points: 3,
    crowns: 0,
    bonus: GemType.Red,
    ability: null,
  },

  // --- 黑色 bonus 卡牌 (4张) ---
  {
    id: 'L2-K01',
    level: 2,
    cost: { [GemType.White]: 1, [GemType.Blue]: 2, [GemType.Green]: 2 },
    points: 1,
    crowns: 1,
    bonus: GemType.Black,
    ability: null,
  },
  {
    id: 'L2-K02',
    level: 2,
    cost: { [GemType.Red]: 3, [GemType.Blue]: 2 },
    points: 2,
    crowns: 0,
    bonus: GemType.Black,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L2-K03',
    level: 2,
    cost: { [GemType.White]: 2, [GemType.Green]: 2, [GemType.Red]: 1 },
    points: 1,
    crowns: 1,
    bonus: GemType.Black,
    ability: CardAbility.TakeToken,
  },
  {
    id: 'L2-K04',
    level: 2,
    cost: { [GemType.Red]: 3, [GemType.White]: 1, [GemType.Pearl]: 1 },
    points: 2,
    crowns: 2,
    bonus: GemType.Black,
    ability: null,
  },

  // --- Wild bonus 卡牌 (1张，CopyColor 能力) ---
  {
    id: 'L2-WILD01',
    level: 2,
    cost: { [GemType.White]: 1, [GemType.Blue]: 1, [GemType.Green]: 1, [GemType.Red]: 1, [GemType.Black]: 1 },
    points: 2,
    crowns: 1,
    bonus: 'Wild',
    ability: CardAbility.CopyColor,
  },
];

// ============================================================
// Level 3 卡牌（15张）
// 特点：高费用（5-9宝石），3-5分，1-3皇冠
// 能力分布：RobToken, ExtraTurn, CopyColor 为主
// ============================================================
export const LEVEL_3_CARDS: Card[] = [
  // --- 白色 bonus 卡牌 (3张) ---
  {
    id: 'L3-W01',
    level: 3,
    cost: { [GemType.Blue]: 3, [GemType.Green]: 3, [GemType.Black]: 2 },
    points: 3,
    crowns: 1,
    bonus: GemType.White,
    ability: null,
  },
  {
    id: 'L3-W02',
    level: 3,
    cost: { [GemType.Blue]: 4, [GemType.Green]: 2, [GemType.Pearl]: 1 },
    points: 4,
    crowns: 2,
    bonus: GemType.White,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L3-W03',
    level: 3,
    cost: { [GemType.Blue]: 3, [GemType.Green]: 2, [GemType.Red]: 2, [GemType.Black]: 1 },
    points: 3,
    crowns: 2,
    bonus: GemType.White,
    ability: CardAbility.RobToken,
  },

  // --- 蓝色 bonus 卡牌 (3张) ---
  {
    id: 'L3-B01',
    level: 3,
    cost: { [GemType.White]: 3, [GemType.Green]: 2, [GemType.Red]: 3 },
    points: 3,
    crowns: 1,
    bonus: GemType.Blue,
    ability: null,
  },
  {
    id: 'L3-B02',
    level: 3,
    cost: { [GemType.White]: 4, [GemType.Black]: 2, [GemType.Pearl]: 1 },
    points: 4,
    crowns: 2,
    bonus: GemType.Blue,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L3-B03',
    level: 3,
    cost: { [GemType.White]: 3, [GemType.Red]: 2, [GemType.Black]: 2, [GemType.Green]: 1 },
    points: 3,
    crowns: 2,
    bonus: GemType.Blue,
    ability: CardAbility.RobToken,
  },

  // --- 绿色 bonus 卡牌 (3张) ---
  {
    id: 'L3-G01',
    level: 3,
    cost: { [GemType.White]: 2, [GemType.Blue]: 3, [GemType.Black]: 3 },
    points: 3,
    crowns: 1,
    bonus: GemType.Green,
    ability: null,
  },
  {
    id: 'L3-G02',
    level: 3,
    cost: { [GemType.Red]: 4, [GemType.White]: 2, [GemType.Pearl]: 1 },
    points: 4,
    crowns: 2,
    bonus: GemType.Green,
    ability: CardAbility.ExtraTurn,
  },
  {
    id: 'L3-G03',
    level: 3,
    cost: { [GemType.Blue]: 2, [GemType.Red]: 3, [GemType.Black]: 2, [GemType.White]: 1 },
    points: 3,
    crowns: 2,
    bonus: GemType.Green,
    ability: CardAbility.RobToken,
  },

  // --- 红色 bonus 卡牌 (2张) ---
  {
    id: 'L3-R01',
    level: 3,
    cost: { [GemType.White]: 3, [GemType.Blue]: 2, [GemType.Green]: 3 },
    points: 3,
    crowns: 1,
    bonus: GemType.Red,
    ability: null,
  },
  {
    id: 'L3-R02',
    level: 3,
    cost: { [GemType.Black]: 4, [GemType.Blue]: 2, [GemType.Pearl]: 1 },
    points: 5,
    crowns: 3,
    bonus: GemType.Red,
    ability: CardAbility.ExtraTurn,
  },

  // --- 黑色 bonus 卡牌 (2张) ---
  {
    id: 'L3-K01',
    level: 3,
    cost: { [GemType.White]: 3, [GemType.Red]: 3, [GemType.Green]: 2 },
    points: 3,
    crowns: 1,
    bonus: GemType.Black,
    ability: null,
  },
  {
    id: 'L3-K02',
    level: 3,
    cost: { [GemType.Green]: 4, [GemType.Red]: 2, [GemType.Pearl]: 1 },
    points: 5,
    crowns: 3,
    bonus: GemType.Black,
    ability: CardAbility.ExtraTurn,
  },

  // --- Wild bonus 卡牌 (2张，CopyColor 能力) ---
  {
    id: 'L3-WILD01',
    level: 3,
    cost: { [GemType.White]: 2, [GemType.Blue]: 2, [GemType.Green]: 2, [GemType.Red]: 1 },
    points: 4,
    crowns: 2,
    bonus: 'Wild',
    ability: CardAbility.CopyColor,
  },
  {
    id: 'L3-WILD02',
    level: 3,
    cost: { [GemType.Red]: 2, [GemType.Black]: 2, [GemType.Blue]: 2, [GemType.Green]: 1 },
    points: 4,
    crowns: 2,
    bonus: 'Wild',
    ability: CardAbility.CopyColor,
  },
];

/** 所有卡牌数据 */
export const ALL_CARDS: Card[] = [
  ...LEVEL_1_CARDS,
  ...LEVEL_2_CARDS,
  ...LEVEL_3_CARDS,
];

/** 按等级分组的卡牌 */
export const CARDS_BY_LEVEL: Record<number, Card[]> = {
  1: LEVEL_1_CARDS,
  2: LEVEL_2_CARDS,
  3: LEVEL_3_CARDS,
};
