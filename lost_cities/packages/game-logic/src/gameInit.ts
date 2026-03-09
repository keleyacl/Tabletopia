// ============================================================
// 失落的城市 - 游戏初始化
// ============================================================

import {
  Card,
  Color,
  Expeditions,
  DiscardPiles,
  RoundState,
  GameState,
} from '@lost-cities/shared';
import { COLORS, NUMBERS, DEFAULT_ROUNDS_TOTAL, INITIAL_HAND_SIZE } from '@lost-cities/shared';

/**
 * 洗牌（Fisher-Yates）
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 创建完整牌组（60张）
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;
  for (const color of COLORS) {
    // 每种颜色 3 张投资牌
    for (let i = 0; i < 3; i += 1) {
      deck.push({ id: id++, color, type: 'wager', value: 0 });
    }
    // 每种颜色 2-10 点数牌
    for (const value of NUMBERS) {
      deck.push({ id: id++, color, type: 'number', value });
    }
  }
  return shuffle(deck);
}

/**
 * 发牌（每人8张）
 */
export function dealHands(deck: Card[]): [Card[], Card[]] {
  const hands: [Card[], Card[]] = [[], []];
  for (let i = 0; i < INITIAL_HAND_SIZE; i += 1) {
    hands[0].push(deck.pop()!);
    hands[1].push(deck.pop()!);
  }
  return hands;
}

/**
 * 创建空探险列
 */
export function createEmptyExpeditions(): Expeditions {
  const expeditions: Partial<Expeditions> = {};
  for (const color of COLORS) {
    expeditions[color] = [];
  }
  return expeditions as Expeditions;
}

/**
 * 创建空弃牌堆
 */
export function createEmptyDiscards(): DiscardPiles {
  const discards: Partial<DiscardPiles> = {};
  for (const color of COLORS) {
    discards[color] = [];
  }
  return discards as DiscardPiles;
}

/**
 * 创建单局状态
 */
export function createRoundState(startingPlayer: number = 0): RoundState {
  const deck = createDeck();
  const [handA, handB] = dealHands(deck);
  return {
    deck,
    discardPiles: createEmptyDiscards(),
    hands: [handA, handB],
    expeditions: [createEmptyExpeditions(), createEmptyExpeditions()],
    turn: startingPlayer,
    startingPlayer,
    phase: 'play',
    lastDiscard: null,
    finished: false,
  };
}

/**
 * 创建游戏状态
 */
export function createGameState(roundsTotal: number = DEFAULT_ROUNDS_TOTAL): GameState {
  return {
    roundsTotal,
    roundIndex: 1,
    round: createRoundState(0),
    scores: [0, 0],
    history: [],
    roundResult: null,
  };
}
