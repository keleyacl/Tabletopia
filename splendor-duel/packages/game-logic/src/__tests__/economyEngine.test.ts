import { describe, it, expect } from 'vitest';
import {
  canAfford,
  calculateNetCost,
  calculateGoldNeeded,
  calculatePayment,
  getTotalTokenCount,
} from '../economyEngine';
import { Card, CardAbility, GemType, Player } from '@splendor/shared';
import { ALL_GEM_TYPES } from '@splendor/shared';
import { createEmptyPlayer } from '../gameInit';

/** 辅助函数：创建测试卡牌 */
function createTestCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test-card',
    level: 1,
    cost: {},
    points: 0,
    crowns: 0,
    bonus: GemType.White,
    ability: null,
    ...overrides,
  };
}

/** 辅助函数：给玩家添加宝石 */
function giveGems(player: Player, gems: Partial<Record<GemType, number>>): void {
  for (const [gem, count] of Object.entries(gems)) {
    player.inventory[gem as GemType] = count || 0;
  }
}

/** 辅助函数：给玩家添加 bonus */
function giveBonuses(player: Player, bonuses: Partial<Record<GemType, number>>): void {
  for (const [gem, count] of Object.entries(bonuses)) {
    player.bonuses[gem as GemType] = count || 0;
  }
}

describe('EconomyEngine', () => {
  describe('calculateNetCost', () => {
    it('无 bonus 时应返回原始费用', () => {
      const player = createEmptyPlayer(0);
      const card = createTestCard({
        cost: { [GemType.Blue]: 3, [GemType.Red]: 2 },
      });
      const netCost = calculateNetCost(player, card);
      expect(netCost[GemType.Blue]).toBe(3);
      expect(netCost[GemType.Red]).toBe(2);
    });

    it('有 bonus 时应扣除折扣', () => {
      const player = createEmptyPlayer(0);
      giveBonuses(player, { [GemType.Blue]: 2 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3, [GemType.Red]: 2 },
      });
      const netCost = calculateNetCost(player, card);
      expect(netCost[GemType.Blue]).toBe(1); // 3 - 2 = 1
      expect(netCost[GemType.Red]).toBe(2);
    });

    it('bonus 超过费用时应返回 0', () => {
      const player = createEmptyPlayer(0);
      giveBonuses(player, { [GemType.Blue]: 5 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      const netCost = calculateNetCost(player, card);
      expect(netCost[GemType.Blue]).toBe(0);
    });
  });

  describe('calculateGoldNeeded', () => {
    it('资源充足时不需要黄金', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 3 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      expect(calculateGoldNeeded(player, card)).toBe(0);
    });

    it('资源不足时需要黄金补齐', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 1 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      expect(calculateGoldNeeded(player, card)).toBe(2);
    });

    it('多种颜色不足时应累加黄金需求', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 1, [GemType.Red]: 0 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3, [GemType.Red]: 2 },
      });
      expect(calculateGoldNeeded(player, card)).toBe(4); // (3-1) + (2-0) = 4
    });
  });

  describe('canAfford', () => {
    it('资源充足时应返回 true', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 3, [GemType.Red]: 2 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3, [GemType.Red]: 2 },
      });
      expect(canAfford(player, card)).toBe(true);
    });

    it('资源不足但有足够黄金时应返回 true', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 1, [GemType.Gold]: 2 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      expect(canAfford(player, card)).toBe(true);
    });

    it('资源和黄金都不足时应返回 false', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 1, [GemType.Gold]: 1 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      expect(canAfford(player, card)).toBe(false);
    });

    it('有 bonus 折扣时应正确计算', () => {
      const player = createEmptyPlayer(0);
      giveBonuses(player, { [GemType.Blue]: 2 });
      giveGems(player, { [GemType.Blue]: 1 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3 },
      });
      expect(canAfford(player, card)).toBe(true); // 需要 3-2=1，有 1 个蓝
    });

    it('免费卡牌应返回 true', () => {
      const player = createEmptyPlayer(0);
      const card = createTestCard({ cost: {} });
      expect(canAfford(player, card)).toBe(true);
    });
  });

  describe('calculatePayment', () => {
    it('应正确计算支付明细', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, { [GemType.Blue]: 2, [GemType.Red]: 3, [GemType.Gold]: 1 });
      const card = createTestCard({
        cost: { [GemType.Blue]: 3, [GemType.Red]: 2 },
      });
      const { payment, goldUsed } = calculatePayment(player, card);
      expect(payment[GemType.Blue]).toBe(2); // 有 2 个蓝，用 2 个
      expect(payment[GemType.Red]).toBe(2);  // 有 3 个红，用 2 个
      expect(goldUsed).toBe(1);              // 蓝差 1 个，用 1 黄金
      expect(payment[GemType.Gold]).toBe(1);
    });
  });

  describe('getTotalTokenCount', () => {
    it('应正确统计所有宝石', () => {
      const player = createEmptyPlayer(0);
      giveGems(player, {
        [GemType.White]: 1,
        [GemType.Blue]: 2,
        [GemType.Green]: 1,
        [GemType.Gold]: 1,
      });
      expect(getTotalTokenCount(player)).toBe(5);
    });

    it('空库存应返回 0', () => {
      const player = createEmptyPlayer(0);
      expect(getTotalTokenCount(player)).toBe(0);
    });
  });
});
