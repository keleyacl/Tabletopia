import { describe, it, expect } from 'vitest';
import { checkGameEnd, calculateFinalScores, getPlayerView } from '../gameEnd';
import { initializeGame } from '../gameInit';
import type { GameState } from '@jaipur/shared';
import { TRADE_GOODS } from '@jaipur/shared';

/**
 * 创建一个可控的测试游戏状态
 */
function createTestState(): GameState {
  const state = initializeGame();

  state.market = ['DIAMOND', 'GOLD', 'CAMEL', 'CLOTH', 'SPICE'];
  state.players[0].hand = ['DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE'];
  state.players[0].camels = 3;
  state.players[0].score = 20;
  state.players[0].tokens = [7, 7, 6];
  state.players[0].bonusTokens = [];
  state.players[1].hand = ['LEATHER', 'LEATHER', 'LEATHER', 'CLOTH', 'SPICE'];
  state.players[1].camels = 2;
  state.players[1].score = 15;
  state.players[1].tokens = [5, 5, 5];
  state.players[1].bonusTokens = [];
  state.deck = ['LEATHER', 'SILVER', 'GOLD'];
  state.currentPlayerIndex = 0;
  state.gameStatus = 'PLAYING';
  state.winner = null;

  return state;
}

// ============================================================
// checkGameEnd 测试
// ============================================================

describe('checkGameEnd', () => {
  it('牌堆不为空且标记堆未耗尽时不应结束', () => {
    const state = createTestState();
    expect(checkGameEnd(state)).toBe(false);
  });

  it('牌堆为空时应结束', () => {
    const state = createTestState();
    state.deck = [];
    expect(checkGameEnd(state)).toBe(true);
  });

  it('3 种货物标记被拿完时应结束', () => {
    const state = createTestState();
    state.tokens.DIAMOND = [];
    state.tokens.GOLD = [];
    state.tokens.SILVER = [];
    expect(checkGameEnd(state)).toBe(true);
  });

  it('只有 2 种货物标记被拿完时不应结束', () => {
    const state = createTestState();
    state.tokens.DIAMOND = [];
    state.tokens.GOLD = [];
    expect(checkGameEnd(state)).toBe(false);
  });
});

// ============================================================
// calculateFinalScores 测试
// ============================================================

describe('calculateFinalScores', () => {
  it('骆驼多的玩家应获得 5 分奖励', () => {
    const state = createTestState();
    // 玩家 0 有 3 只骆驼，玩家 1 有 2 只
    calculateFinalScores(state);
    expect(state.players[0].score).toBe(25); // 20 + 5
    expect(state.players[1].score).toBe(15); // 不变
  });

  it('骆驼数量相同时无人获得奖励', () => {
    const state = createTestState();
    state.players[1].camels = 3; // 与玩家 0 相同
    calculateFinalScores(state);
    expect(state.players[0].score).toBe(20); // 不变
    expect(state.players[1].score).toBe(15); // 不变
  });

  it('分数高的玩家应获胜', () => {
    const state = createTestState();
    calculateFinalScores(state);
    expect(state.winner).toBe(0); // 玩家 0: 25 > 玩家 1: 15
    expect(state.gameStatus).toBe('ROUND_OVER');
    // 第一局结束，roundResults 应记录本局结果
    expect(state.roundResults).toHaveLength(1);
    expect(state.roundResults[0].winner).toBe(0);
    expect(state.roundWins[0]).toBe(1);
    expect(state.roundWins[1]).toBe(0);
  });

  it('分数相同时奖励标记多的玩家获胜', () => {
    const state = createTestState();
    state.players[0].score = 15;
    state.players[0].camels = 2; // 与玩家 1 相同，无骆驼王
    state.players[0].bonusTokens = [3, 2];
    state.players[1].bonusTokens = [3];
    calculateFinalScores(state);
    expect(state.winner).toBe(0); // 奖励标记多
  });

  it('分数和奖励标记都相同时货物标记多的玩家获胜', () => {
    const state = createTestState();
    state.players[0].score = 15;
    state.players[0].camels = 2;
    state.players[0].bonusTokens = [3];
    state.players[1].bonusTokens = [3];
    // 玩家 0 有 3 个标记，玩家 1 也有 3 个 → 平局
    calculateFinalScores(state);
    // 都相同则 winner 为 null
    expect(state.winner).toBeNull();
  });

  it('完全平局时 winner 应为 null', () => {
    const state = createTestState();
    state.players[0].score = 15;
    state.players[0].camels = 2;
    state.players[0].tokens = [5, 5, 5];
    state.players[0].bonusTokens = [];
    calculateFinalScores(state);
    expect(state.winner).toBeNull();
  });
});

// ============================================================
// getPlayerView 测试
// ============================================================

describe('getPlayerView', () => {
  it('应正确生成玩家 0 的视角', () => {
    const state = createTestState();
    const view = getPlayerView(state, 0);

    expect(view.myPlayerIndex).toBe(0);
    expect(view.myPlayer.hand).toEqual(state.players[0].hand);
    expect(view.opponent.handCount).toBe(state.players[1].hand.length);
    expect(view.market).toEqual(state.market);
    expect(view.deckCount).toBe(state.deck.length);
  });

  it('应正确生成玩家 1 的视角', () => {
    const state = createTestState();
    const view = getPlayerView(state, 1);

    expect(view.myPlayerIndex).toBe(1);
    expect(view.myPlayer.hand).toEqual(state.players[1].hand);
    expect(view.opponent.handCount).toBe(state.players[0].hand.length);
  });

  it('不应暴露对手手牌详情', () => {
    const state = createTestState();
    const view = getPlayerView(state, 0);

    // opponent 只有 handCount，没有 hand
    expect((view.opponent as any).hand).toBeUndefined();
  });

  it('不应暴露牌堆内容', () => {
    const state = createTestState();
    const view = getPlayerView(state, 0);

    // 只有 deckCount，没有 deck
    expect((view as any).deck).toBeUndefined();
  });

  it('应正确显示标记信息', () => {
    const state = createTestState();
    const view = getPlayerView(state, 0);

    for (const goodType of TRADE_GOODS) {
      const info = view.tokenInfo[goodType];
      expect(info.remaining).toBe(state.tokens[goodType].length);
      if (state.tokens[goodType].length > 0) {
        expect(info.topValue).toBe(state.tokens[goodType][0]);
      } else {
        expect(info.topValue).toBeNull();
      }
    }
  });

  it('应返回深拷贝，修改视角不影响原状态', () => {
    const state = createTestState();
    const view = getPlayerView(state, 0);

    view.myPlayer.hand.push('LEATHER');
    expect(state.players[0].hand.length).toBe(5); // 原状态不变
  });
});
