// ============================================================
// 璀璨宝石·对决 - 游戏初始化 (GameInit)
// ============================================================

import {
  BoardSlot,
  Card,
  GameState,
  GemType,
  Player,
} from '@splendor/shared';
import {
  CARDS_BY_LEVEL,
  CARDS_PER_LEVEL_DISPLAY,
  GEM_COUNTS,
  INITIAL_PRIVILEGES,
  ALL_GEM_TYPES,
} from '@splendor/shared';
import { createEmptyBoard, refillBoard } from './boardLogic.js';

// ============================================================
// 工具函数
// ============================================================

/**
 * Fisher-Yates 洗牌算法
 * 原地打乱数组顺序
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================
// 玩家初始化
// ============================================================

/**
 * 创建空玩家状态
 */
export function createEmptyPlayer(id: 0 | 1): Player {
  const inventory: Record<GemType, number> = {} as Record<GemType, number>;
  const bonuses: Record<GemType, number> = {} as Record<GemType, number>;
  const scoresByColor: Record<GemType, number> = {} as Record<GemType, number>;

  for (const gem of ALL_GEM_TYPES) {
    inventory[gem] = 0;
    bonuses[gem] = 0;
    scoresByColor[gem] = 0;
  }

  return {
    id,
    inventory,
    bonuses,
    privileges: 0,
    reservedCards: [],
    purchasedCards: [],
    crowns: 0,
    score: 0,
    scoresByColor,
  };
}

// ============================================================
// 游戏初始化
// ============================================================

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
  // 1. 初始化牌堆：洗牌并分配到 decks 和 display
  const decks: Record<number, Card[]> = {};
  const display: Record<number, Card[]> = {};

  for (const level of [1, 2, 3]) {
    const cards = CARDS_BY_LEVEL[level];
    const shuffled = shuffleArray(cards);
    const displayCount = CARDS_PER_LEVEL_DISPLAY[level];
    display[level] = shuffled.slice(0, displayCount);
    decks[level] = shuffled.slice(displayCount);
  }

  // 2. 初始化宝石袋
  const bag: GemType[] = [];
  for (const [gem, count] of Object.entries(GEM_COUNTS) as [string, number][]) {
    for (let i = 0; i < count; i++) {
      bag.push(gem as GemType);
    }
  }
  const shuffledBag = shuffleArray(bag);

  // 3. 创建棋盘并填充
  const board = createEmptyBoard();
  // 使用可变的袋子引用来填充
  const mutableBag = [...shuffledBag];
  refillBoard(board, mutableBag);

  // 4. 初始化玩家
  const players: [Player, Player] = [
    createEmptyPlayer(0),
    createEmptyPlayer(1),
  ];

  // 5. 创建游戏状态
  const state: GameState = {
    board,
    bag: mutableBag,
    privilegePool: INITIAL_PRIVILEGES,
    decks,
    display,
    players,
    currentPlayerIndex: 0,
    turnPhase: 'OptionalBefore',
    winner: null,
    pendingAbility: null,
    hasPerformedMainAction: false,
    hasExtraTurn: false,
  };

  return state;
}

/**
 * 从展示区补充卡牌
 * 当展示区有空位时，从牌堆顶部补充
 */
export function refillDisplay(state: GameState): void {
  for (const level of [1, 2, 3]) {
    const displayCount = CARDS_PER_LEVEL_DISPLAY[level];
    while (state.display[level].length < displayCount && state.decks[level].length > 0) {
      const card = state.decks[level].pop()!;
      state.display[level].push(card);
    }
  }
}
