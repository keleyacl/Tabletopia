// ============================================================
// 璀璨宝石·对决 (Splendor Duel) - 游戏常量
// ============================================================

import { Coord, GemType } from './types.js';

/** 棋盘尺寸 */
export const BOARD_SIZE = 5;

/** 玩家宝石持有上限 */
export const MAX_TOKENS = 10;

/** 黄金持有上限 */
export const MAX_GOLD = 3;

/** 预留卡牌上限 */
export const MAX_RESERVED = 3;

/** 初始特权卷轴数量 */
export const INITIAL_PRIVILEGES = 3;

/** 珍珠总数 */
export const PEARL_COUNT = 2;

/** 黄金总数 */
export const GOLD_COUNT = 3;

/** 胜利条件：总分 */
export const VICTORY_SCORE = 20;

/** 胜利条件：皇冠数 */
export const VICTORY_CROWNS = 10;

/** 胜利条件：单色卡牌分数 */
export const VICTORY_COLOR_SCORE = 10;

/** 每级展示区的卡牌数量 */
export const CARDS_PER_LEVEL_DISPLAY: Record<number, number> = {
  1: 4,
  2: 4,
  3: 4,
};

/**
 * 各类宝石在袋中的初始数量
 * 基础色各4颗，珍珠2颗，黄金3颗
 */
export const GEM_COUNTS: Record<GemType, number> = {
  [GemType.White]: 4,
  [GemType.Blue]: 4,
  [GemType.Green]: 4,
  [GemType.Red]: 4,
  [GemType.Black]: 4,
  [GemType.Pearl]: PEARL_COUNT,
  [GemType.Gold]: GOLD_COUNT,
};

/**
 * 5x5 棋盘从中心向外的螺旋坐标序列
 * 用于补充棋盘时按此顺序从中心向外填充
 * 
 * 坐标系：(x=列, y=行)，左上角为 (0,0)
 * 中心点为 (2,2)
 */
export const SPIRAL_ORDER: Coord[] = [
  // 中心
  { x: 2, y: 2 },
  // 第一圈（距中心1格，共8格）
  { x: 3, y: 2 },
  { x: 3, y: 3 },
  { x: 2, y: 3 },
  { x: 1, y: 3 },
  { x: 1, y: 2 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  // 第二圈（距中心2格，共16格）
  { x: 4, y: 1 },
  { x: 4, y: 2 },
  { x: 4, y: 3 },
  { x: 4, y: 4 },
  { x: 3, y: 4 },
  { x: 2, y: 4 },
  { x: 1, y: 4 },
  { x: 0, y: 4 },
  { x: 0, y: 3 },
  { x: 0, y: 2 },
  { x: 0, y: 1 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
];

/** 宝石颜色显示名称（中文） */
export const GEM_DISPLAY_NAMES: Record<GemType, string> = {
  [GemType.White]: '钻石',
  [GemType.Blue]: '蓝宝石',
  [GemType.Green]: '祖母绿',
  [GemType.Red]: '红宝石',
  [GemType.Black]: '缟玛瑙',
  [GemType.Pearl]: '珍珠',
  [GemType.Gold]: '黄金',
};

/** 宝石颜色 CSS 色值（用于 UI 渲染） */
export const GEM_COLORS: Record<GemType, { primary: string; secondary: string; glow: string }> = {
  [GemType.White]: { primary: '#f0f0f0', secondary: '#d4d4d4', glow: 'rgba(255,255,255,0.6)' },
  [GemType.Blue]: { primary: '#2563eb', secondary: '#1d4ed8', glow: 'rgba(37,99,235,0.6)' },
  [GemType.Green]: { primary: '#16a34a', secondary: '#15803d', glow: 'rgba(22,163,74,0.6)' },
  [GemType.Red]: { primary: '#dc2626', secondary: '#b91c1c', glow: 'rgba(220,38,38,0.6)' },
  [GemType.Black]: { primary: '#1f2937', secondary: '#111827', glow: 'rgba(31,41,55,0.6)' },
  [GemType.Pearl]: { primary: '#fdf2f8', secondary: '#f9a8d4', glow: 'rgba(249,168,212,0.6)' },
  [GemType.Gold]: { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245,158,11,0.6)' },
};

/** 基础宝石类型列表（不含珍珠和黄金） */
export const BASIC_GEM_TYPES: GemType[] = [
  GemType.White,
  GemType.Blue,
  GemType.Green,
  GemType.Red,
  GemType.Black,
];

/** 所有非黄金宝石类型 */
export const NON_GOLD_GEM_TYPES: GemType[] = [
  GemType.White,
  GemType.Blue,
  GemType.Green,
  GemType.Red,
  GemType.Black,
  GemType.Pearl,
];

/** 所有宝石类型 */
export const ALL_GEM_TYPES: GemType[] = [
  GemType.White,
  GemType.Blue,
  GemType.Green,
  GemType.Red,
  GemType.Black,
  GemType.Pearl,
  GemType.Gold,
];
