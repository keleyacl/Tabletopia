import { describe, it, expect } from 'vitest';
import { createDeck, initializeTokens, initializeBonusTokens, initializeGame } from '../gameInit';
import { TOTAL_CARDS, MARKET_SIZE, INITIAL_HAND_SIZE, INITIAL_MARKET_CAMELS, TOKEN_VALUES, TRADE_GOODS } from '@jaipur/shared';

describe('createDeck', () => {
  it('应创建 55 张牌', () => {
    const deck = createDeck();
    expect(deck.length).toBe(TOTAL_CARDS);
  });

  it('应包含正确数量的各类型牌', () => {
    const deck = createDeck();
    expect(deck.filter((c) => c === 'DIAMOND').length).toBe(6);
    expect(deck.filter((c) => c === 'GOLD').length).toBe(6);
    expect(deck.filter((c) => c === 'SILVER').length).toBe(6);
    expect(deck.filter((c) => c === 'CLOTH').length).toBe(8);
    expect(deck.filter((c) => c === 'SPICE').length).toBe(8);
    expect(deck.filter((c) => c === 'LEATHER').length).toBe(10);
    expect(deck.filter((c) => c === 'CAMEL').length).toBe(11);
  });
});

describe('initializeTokens', () => {
  it('应为每种货物创建正确的分值栈', () => {
    const tokens = initializeTokens();

    for (const goodType of TRADE_GOODS) {
      expect(tokens[goodType]).toEqual(TOKEN_VALUES[goodType]);
    }
  });

  it('分值栈应为降序排列', () => {
    const tokens = initializeTokens();

    for (const goodType of TRADE_GOODS) {
      const stack = tokens[goodType];
      for (let i = 0; i < stack.length - 1; i++) {
        expect(stack[i]).toBeGreaterThanOrEqual(stack[i + 1]);
      }
    }
  });
});

describe('initializeBonusTokens', () => {
  it('应创建正确数量的奖励标记', () => {
    const bonus = initializeBonusTokens();
    expect(bonus.three.length).toBe(7);
    expect(bonus.four.length).toBe(6);
    expect(bonus.five.length).toBe(5);
  });

  it('三张奖励标记总分应正确', () => {
    const bonus = initializeBonusTokens();
    const sum = bonus.three.reduce((a, b) => a + b, 0);
    // 原始值: [3, 3, 2, 2, 2, 1, 1] 总和 = 14
    expect(sum).toBe(14);
  });

  it('四张奖励标记总分应正确', () => {
    const bonus = initializeBonusTokens();
    const sum = bonus.four.reduce((a, b) => a + b, 0);
    // 原始值: [6, 6, 5, 5, 4, 4] 总和 = 30
    expect(sum).toBe(30);
  });

  it('五张奖励标记总分应正确', () => {
    const bonus = initializeBonusTokens();
    const sum = bonus.five.reduce((a, b) => a + b, 0);
    // 原始值: [10, 10, 9, 8, 8] 总和 = 45
    expect(sum).toBe(45);
  });
});

describe('initializeGame', () => {
  it('市场应有 5 张牌', () => {
    const state = initializeGame();
    expect(state.market.length).toBe(MARKET_SIZE);
  });

  it('市场应包含至少 3 张骆驼', () => {
    const state = initializeGame();
    const camelCount = state.market.filter((c) => c === 'CAMEL').length;
    expect(camelCount).toBeGreaterThanOrEqual(INITIAL_MARKET_CAMELS);
  });

  it('每位玩家的手牌 + 骆驼圈应来自 5 张发牌', () => {
    const state = initializeGame();

    for (const player of state.players) {
      // 手牌数 + 骆驼数 = 初始发牌数
      expect(player.hand.length + player.camels).toBe(INITIAL_HAND_SIZE);
    }
  });

  it('玩家手牌中不应包含骆驼', () => {
    const state = initializeGame();

    for (const player of state.players) {
      expect(player.hand.filter((c) => c === 'CAMEL').length).toBe(0);
    }
  });

  it('所有牌的总数应为 55', () => {
    const state = initializeGame();

    const totalCards =
      state.deck.length +
      state.market.length +
      state.players[0].hand.length +
      state.players[0].camels +
      state.players[1].hand.length +
      state.players[1].camels;

    expect(totalCards).toBe(TOTAL_CARDS);
  });

  it('初始分数应为 0', () => {
    const state = initializeGame();

    for (const player of state.players) {
      expect(player.score).toBe(0);
      expect(player.tokens.length).toBe(0);
      expect(player.bonusTokens.length).toBe(0);
    }
  });

  it('游戏状态应为 PLAYING', () => {
    const state = initializeGame();
    expect(state.gameStatus).toBe('PLAYING');
    expect(state.winner).toBeNull();
    expect(state.currentPlayerIndex).toBe(0);
  });
});
