import { describe, it, expect } from 'vitest';
import {
  createDeck,
  dealHands,
  createEmptyExpeditions,
  createEmptyDiscards,
  createRoundState,
  createGameState,
  shuffle,
} from '../gameInit';
import { COLORS, NUMBERS } from '@lost-cities/shared';

describe('shuffle', () => {
  it('应保持数组长度不变', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result).toHaveLength(arr.length);
  });

  it('应包含所有原始元素', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result.sort()).toEqual(arr.sort());
  });
});

describe('createDeck', () => {
  it('应创建60张牌', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(60);
  });

  it('每种颜色应有12张牌（3投资+9点数）', () => {
    const deck = createDeck();
    for (const color of COLORS) {
      const colorCards = deck.filter((c) => c.color === color);
      expect(colorCards).toHaveLength(12);
    }
  });

  it('每种颜色应有3张投资牌', () => {
    const deck = createDeck();
    for (const color of COLORS) {
      const wagers = deck.filter((c) => c.color === color && c.type === 'wager');
      expect(wagers).toHaveLength(3);
    }
  });

  it('每种颜色应有9张点数牌（2-10）', () => {
    const deck = createDeck();
    for (const color of COLORS) {
      const numbers = deck.filter((c) => c.color === color && c.type === 'number');
      expect(numbers).toHaveLength(9);
      const values = numbers.map((c) => c.value).sort((a, b) => a - b);
      expect(values).toEqual(NUMBERS);
    }
  });

  it('每张牌应有唯一id', () => {
    const deck = createDeck();
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(60);
  });
});

describe('dealHands', () => {
  it('应给每人发8张牌', () => {
    const deck = createDeck();
    const originalLength = deck.length;
    const [hand0, hand1] = dealHands(deck);
    expect(hand0).toHaveLength(8);
    expect(hand1).toHaveLength(8);
    expect(deck).toHaveLength(originalLength - 16);
  });
});

describe('createEmptyExpeditions', () => {
  it('应为每种颜色创建空数组', () => {
    const expeditions = createEmptyExpeditions();
    for (const color of COLORS) {
      expect(expeditions[color]).toEqual([]);
    }
  });
});

describe('createEmptyDiscards', () => {
  it('应为每种颜色创建空数组', () => {
    const discards = createEmptyDiscards();
    for (const color of COLORS) {
      expect(discards[color]).toEqual([]);
    }
  });
});

describe('createRoundState', () => {
  it('应创建有效的单局状态', () => {
    const round = createRoundState(0);
    expect(round.deck.length + 16).toBe(60); // 60 - 16张手牌
    expect(round.hands[0]).toHaveLength(8);
    expect(round.hands[1]).toHaveLength(8);
    expect(round.turn).toBe(0);
    expect(round.startingPlayer).toBe(0);
    expect(round.phase).toBe('play');
    expect(round.lastDiscard).toBeNull();
    expect(round.finished).toBe(false);
  });

  it('应支持指定先手玩家', () => {
    const round = createRoundState(1);
    expect(round.turn).toBe(1);
    expect(round.startingPlayer).toBe(1);
  });
});

describe('createGameState', () => {
  it('应创建默认3局的游戏状态', () => {
    const state = createGameState();
    expect(state.roundsTotal).toBe(3);
    expect(state.roundIndex).toBe(1);
    expect(state.scores).toEqual([0, 0]);
    expect(state.history).toEqual([]);
    expect(state.roundResult).toBeNull();
  });

  it('应支持自定义局数', () => {
    const state = createGameState(5);
    expect(state.roundsTotal).toBe(5);
  });
});
