import { describe, it, expect, beforeEach } from 'vitest';
import { takeOne, takeCamels, exchange, sellGoods } from '../gameActions';
import { initializeGame } from '../gameInit';
import type { GameState } from '@jaipur/shared';

/**
 * 创建一个可控的测试游戏状态
 * 市场: [DIAMOND, GOLD, CAMEL, CLOTH, SPICE]
 * 玩家0手牌: [DIAMOND, GOLD, SILVER, CLOTH, SPICE]
 * 玩家0骆驼: 2
 * 玩家1手牌: [LEATHER, LEATHER, LEATHER, CLOTH, SPICE]
 * 玩家1骆驼: 1
 */
function createTestState(): GameState {
  const state = initializeGame();

  // 覆盖为可控状态
  state.market = ['DIAMOND', 'GOLD', 'CAMEL', 'CLOTH', 'SPICE'];
  state.players[0].hand = ['DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE'];
  state.players[0].camels = 2;
  state.players[0].score = 0;
  state.players[0].tokens = [];
  state.players[0].bonusTokens = [];
  state.players[1].hand = ['LEATHER', 'LEATHER', 'LEATHER', 'CLOTH', 'SPICE'];
  state.players[1].camels = 1;
  state.players[1].score = 0;
  state.players[1].tokens = [];
  state.players[1].bonusTokens = [];
  state.deck = ['LEATHER', 'SILVER', 'GOLD', 'DIAMOND', 'CLOTH', 'SPICE', 'CAMEL', 'CAMEL'];
  state.currentPlayerIndex = 0;
  state.gameStatus = 'PLAYING';
  state.winner = null;

  return state;
}

// ============================================================
// takeOne 测试
// ============================================================

describe('takeOne', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestState();
  });

  it('应正常从市场取一张非骆驼牌', () => {
    const result = takeOne(state, 0); // 取 DIAMOND
    expect(result.success).toBe(true);
    expect(result.state!.players[0].hand).toContain('DIAMOND');
    expect(result.state!.players[0].hand.length).toBe(6);
    expect(result.state!.market.length).toBe(5); // 补齐
  });

  it('取牌后应切换回合', () => {
    const result = takeOne(state, 0);
    expect(result.success).toBe(true);
    expect(result.state!.currentPlayerIndex).toBe(1);
  });

  it('不能取骆驼牌', () => {
    const result = takeOne(state, 2); // 索引 2 是 CAMEL
    expect(result.success).toBe(false);
    expect(result.error).toContain('骆驼');
  });

  it('手牌已满时不能取牌', () => {
    state.players[0].hand = ['DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE', 'LEATHER', 'LEATHER'];
    const result = takeOne(state, 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('上限');
  });

  it('无效索引应返回错误', () => {
    const result = takeOne(state, 10);
    expect(result.success).toBe(false);
    expect(result.error).toContain('索引');
  });

  it('负数索引应返回错误', () => {
    const result = takeOne(state, -1);
    expect(result.success).toBe(false);
  });

  it('不应修改原始状态', () => {
    const originalMarket = [...state.market];
    takeOne(state, 0);
    expect(state.market).toEqual(originalMarket);
  });
});

// ============================================================
// takeCamels 测试
// ============================================================

describe('takeCamels', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestState();
  });

  it('应取走市场中所有骆驼', () => {
    const result = takeCamels(state);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].camels).toBe(3); // 原有 2 + 市场 1
    expect(result.state!.market.filter((c) => c === 'CAMEL').length).toBe(0);
  });

  it('取骆驼后应补齐市场', () => {
    const result = takeCamels(state);
    expect(result.success).toBe(true);
    expect(result.state!.market.length).toBe(5);
  });

  it('取骆驼后应切换回合', () => {
    const result = takeCamels(state);
    expect(result.success).toBe(true);
    expect(result.state!.currentPlayerIndex).toBe(1);
  });

  it('市场无骆驼时应返回错误', () => {
    state.market = ['DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE'];
    const result = takeCamels(state);
    expect(result.success).toBe(false);
    expect(result.error).toContain('没有骆驼');
  });

  it('多张骆驼应全部取走', () => {
    state.market = ['CAMEL', 'CAMEL', 'CAMEL', 'DIAMOND', 'GOLD'];
    const result = takeCamels(state);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].camels).toBe(5); // 原有 2 + 市场 3
  });
});

// ============================================================
// exchange 测试
// ============================================================

describe('exchange', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestState();
  });

  it('应正常交换手牌和市场牌', () => {
    // 用手牌的 CLOTH(3) 和 SPICE(4) 换市场的 DIAMOND(0) 和 GOLD(1)
    const result = exchange(state, [0, 1], [3, 4], 0);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].hand).toContain('DIAMOND');
    expect(result.state!.players[0].hand).toContain('GOLD');
    // 原来手牌中已有 DIAMOND 和 GOLD，现在又多了从市场取的
    expect(result.state!.players[0].hand.filter((c) => c === 'DIAMOND').length).toBe(2);
  });

  it('应支持用骆驼参与交换', () => {
    // 用 1 张手牌 + 1 只骆驼 换市场 2 张
    const result = exchange(state, [0, 1], [3], 1);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].camels).toBe(1); // 原有 2 - 1
  });

  it('应支持全部用骆驼交换', () => {
    // 用 2 只骆驼换市场的 DIAMOND(0) 和 GOLD(1)
    const result = exchange(state, [0, 1], [], 2);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].camels).toBe(0);
    expect(result.state!.players[0].hand.length).toBe(7); // 5 + 2
  });

  it('交换后应切换回合', () => {
    const result = exchange(state, [0, 1], [3, 4], 0);
    expect(result.success).toBe(true);
    expect(result.state!.currentPlayerIndex).toBe(1);
  });

  it('交换数量少于 2 应返回错误', () => {
    const result = exchange(state, [0], [3], 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('至少');
  });

  it('给出和取出数量不匹配应返回错误', () => {
    const result = exchange(state, [0, 1], [3], 0); // 取 2 给 1
    expect(result.success).toBe(false);
    expect(result.error).toContain('数量');
  });

  it('骆驼不足应返回错误', () => {
    const result = exchange(state, [0, 1, 3], [], 3); // 只有 2 只骆驼
    expect(result.success).toBe(false);
    expect(result.error).toContain('骆驼');
  });

  it('不能用骆驼换骆驼', () => {
    state.market = ['CAMEL', 'CAMEL', 'DIAMOND', 'GOLD', 'SILVER'];
    const result = exchange(state, [0, 1], [], 2); // 用骆驼换骆驼
    expect(result.success).toBe(false);
    expect(result.error).toContain('骆驼换骆驼');
  });

  it('交换后手牌超过上限应返回错误', () => {
    state.players[0].hand = ['DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE', 'LEATHER', 'LEATHER'];
    // 用 2 只骆驼换 2 张市场牌，手牌将变为 9 张
    const result = exchange(state, [0, 1], [], 2);
    expect(result.success).toBe(false);
    expect(result.error).toContain('上限');
  });

  it('市场索引重复应返回错误', () => {
    const result = exchange(state, [0, 0], [3, 4], 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('重复');
  });

  it('手牌索引重复应返回错误', () => {
    const result = exchange(state, [0, 1], [3, 3], 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('重复');
  });
});

// ============================================================
// sellGoods 测试
// ============================================================

describe('sellGoods', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestState();
  });

  it('应正常出售普通货物', () => {
    state.players[0].hand = ['CLOTH', 'CLOTH', 'CLOTH', 'DIAMOND', 'GOLD'];
    const result = sellGoods(state, 'CLOTH', 1);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].hand.filter((c) => c === 'CLOTH').length).toBe(2);
    expect(result.state!.players[0].score).toBeGreaterThan(0);
  });

  it('出售后应获得对应分值标记', () => {
    const result = sellGoods(state, 'CLOTH', 1);
    expect(result.success).toBe(true);
    // 布料栈顶值为 5
    expect(result.state!.players[0].tokens).toContain(5);
    expect(result.state!.players[0].score).toBe(5);
  });

  it('出售多张应获得多个标记', () => {
    state.players[0].hand = ['CLOTH', 'CLOTH', 'CLOTH', 'DIAMOND', 'GOLD'];
    const result = sellGoods(state, 'CLOTH', 3);
    expect(result.success).toBe(true);
    // 布料栈: [5, 3, 3, 2, 2, 1, 1]，取前 3 个: 5+3+3=11
    expect(result.state!.players[0].tokens).toEqual([5, 3, 3]);
    // 还应获得 3 张奖励标记
    expect(result.state!.players[0].bonusTokens.length).toBe(1);
  });

  it('出售 4 张应获得 4 张奖励标记', () => {
    state.players[0].hand = ['LEATHER', 'LEATHER', 'LEATHER', 'LEATHER', 'GOLD'];
    const result = sellGoods(state, 'LEATHER', 4);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].bonusTokens.length).toBe(1);
    // 奖励来自 four 堆
  });

  it('出售 5 张应获得 5 张奖励标记', () => {
    state.players[0].hand = ['LEATHER', 'LEATHER', 'LEATHER', 'LEATHER', 'LEATHER'];
    const result = sellGoods(state, 'LEATHER', 5);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].bonusTokens.length).toBe(1);
    // 奖励来自 five 堆
  });

  it('高级货物至少出售 2 张', () => {
    const result = sellGoods(state, 'DIAMOND', 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('至少');
  });

  it('高级货物出售 2 张应成功', () => {
    state.players[0].hand = ['DIAMOND', 'DIAMOND', 'GOLD', 'SILVER', 'CLOTH'];
    const result = sellGoods(state, 'DIAMOND', 2);
    expect(result.success).toBe(true);
    // 钻石栈: [7, 7, 5, 5, 5]，取前 2 个: 7+7=14
    expect(result.state!.players[0].tokens).toEqual([7, 7]);
    expect(result.state!.players[0].score).toBe(14);
  });

  it('手牌不足应返回错误', () => {
    const result = sellGoods(state, 'CLOTH', 5); // 只有 1 张 CLOTH
    expect(result.success).toBe(false);
    expect(result.error).toContain('不足');
  });

  it('出售数量为 0 应返回错误', () => {
    const result = sellGoods(state, 'CLOTH', 0);
    expect(result.success).toBe(false);
  });

  it('出售后应切换回合', () => {
    state.players[0].hand = ['CLOTH', 'CLOTH', 'DIAMOND', 'GOLD', 'SILVER'];
    const result = sellGoods(state, 'CLOTH', 1);
    expect(result.success).toBe(true);
    expect(result.state!.currentPlayerIndex).toBe(1);
  });

  it('标记堆为空时仍可出售但不获得标记分数', () => {
    state.tokens.CLOTH = []; // 清空布料标记
    const result = sellGoods(state, 'CLOTH', 1);
    expect(result.success).toBe(true);
    expect(result.state!.players[0].tokens.length).toBe(0);
    expect(result.state!.players[0].score).toBe(0);
  });
});
