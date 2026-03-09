import { describe, it, expect, beforeEach } from 'vitest';
import {
  takeTokens,
  reserveCard,
  purchaseCard,
  usePrivilege,
  doRefillBoard,
  discardTokens,
} from '../gameActions';
import { createInitialState, createEmptyPlayer } from '../gameInit';
import { createEmptyBoard } from '../boardLogic';
import { GemType, GameState, Card, CardAbility } from '@splendor/shared';
import { BOARD_SIZE, MAX_RESERVED, MAX_TOKENS } from '@splendor/shared';

/** 辅助函数：创建一个简单的测试状态 */
function createTestState(): GameState {
  const state = createInitialState();
  // 确保棋盘有宝石可以拿
  return state;
}

/** 辅助函数：在棋盘上放置宝石 */
function placeGem(state: GameState, x: number, y: number, gem: GemType): void {
  state.board[y][x].gem = gem;
}

/** 辅助函数：清空棋盘 */
function clearBoard(state: GameState): void {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      state.board[y][x].gem = null;
    }
  }
}

describe('GameActions', () => {
  describe('takeTokens', () => {
    it('应成功拿取 1 个宝石', () => {
      const state = createTestState();
      // 确保 (0,0) 有非黄金宝石
      const gem = state.board[0][0].gem;
      if (gem && gem !== GemType.Gold) {
        state.turnPhase = 'Main';
        state.hasPerformedMainAction = false;
        const result = takeTokens(state, [{ x: 0, y: 0 }]);
        expect(result.success).toBe(true);
        expect(state.board[0][0].gem).toBeNull();
      }
    });

    it('非 Main 阶段不能拿取', () => {
      const state = createTestState();
      state.turnPhase = 'OptionalBefore';
      const result = takeTokens(state, [{ x: 0, y: 0 }]);
      expect(result.success).toBe(false);
    });

    it('已执行主动作后不能再拿取', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = true;
      const result = takeTokens(state, [{ x: 0, y: 0 }]);
      expect(result.success).toBe(false);
    });

    it('拿取 3 个同色宝石应触发对手获得特权', () => {
      const state = createTestState();
      clearBoard(state);
      placeGem(state, 0, 0, GemType.Blue);
      placeGem(state, 1, 0, GemType.Blue);
      placeGem(state, 2, 0, GemType.Blue);
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;
      state.privilegePool = 3;

      const opponentPrivilegesBefore = state.players[1].privileges;
      takeTokens(state, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(state.players[1].privileges).toBe(opponentPrivilegesBefore + 1);
    });
  });

  describe('reserveCard', () => {
    it('应成功预留展示区的卡牌', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;
      const cardId = state.display[1][0].id;
      const result = reserveCard(state, cardId);
      expect(result.success).toBe(true);
      expect(state.players[0].reservedCards.length).toBe(1);
      expect(state.players[0].reservedCards[0].id).toBe(cardId);
    });

    it('预留上限应为 3 张', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;

      // 手动添加 3 张预留卡
      for (let i = 0; i < MAX_RESERVED; i++) {
        state.players[0].reservedCards.push({
          id: `reserved-${i}`,
          level: 1,
          cost: {},
          points: 0,
          crowns: 0,
          bonus: GemType.White,
          ability: null,
        });
      }

      const cardId = state.display[1][0].id;
      const result = reserveCard(state, cardId);
      expect(result.success).toBe(false);
    });
  });

  describe('purchaseCard', () => {
    it('资源充足时应成功购买', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;

      // 给玩家足够的资源
      const card = state.display[1][0];
      for (const [gem, count] of Object.entries(card.cost)) {
        state.players[0].inventory[gem as GemType] = (count as number) + 1;
      }

      const result = purchaseCard(state, card.id);
      expect(result.success).toBe(true);
      expect(state.players[0].purchasedCards.length).toBeGreaterThanOrEqual(1);
    });

    it('资源不足时应失败', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;

      // 确保玩家没有任何资源
      const player = state.players[0];
      for (const gem of Object.values(GemType)) {
        player.inventory[gem] = 0;
      }
      player.bonuses = { ...player.inventory };

      // 找一张有费用的卡
      const card = state.display[1].find((c: any) => Object.keys(c.cost).length > 0);
      if (card) {
        const result = purchaseCard(state, card.id);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('usePrivilege', () => {
    it('在 OptionalBefore 阶段应成功使用', () => {
      const state = createTestState();
      state.turnPhase = 'OptionalBefore';
      state.players[0].privileges = 1;

      // 找一个有非黄金宝石的位置
      let coord = { x: 0, y: 0 };
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const gem = state.board[y][x].gem;
          if (gem && gem !== GemType.Gold) {
            coord = { x, y };
            break;
          }
        }
      }

      const gemBefore = state.board[coord.y][coord.x].gem;
      if (gemBefore && gemBefore !== GemType.Gold) {
        const result = usePrivilege(state, coord);
        expect(result.success).toBe(true);
        expect(state.players[0].privileges).toBe(0);
        expect(state.board[coord.y][coord.x].gem).toBeNull();
      }
    });

    it('没有特权卷轴时应失败', () => {
      const state = createTestState();
      state.turnPhase = 'OptionalBefore';
      state.players[0].privileges = 0;
      const result = usePrivilege(state, { x: 0, y: 0 });
      expect(result.success).toBe(false);
    });

    it('不能使用特权拿取黄金', () => {
      const state = createTestState();
      state.turnPhase = 'OptionalBefore';
      state.players[0].privileges = 1;
      clearBoard(state);
      placeGem(state, 0, 0, GemType.Gold);
      const result = usePrivilege(state, { x: 0, y: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('doRefillBoard', () => {
    it('应重置棋盘并给对手特权', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      state.hasPerformedMainAction = false;
      state.privilegePool = 3;

      const opponentPrivilegesBefore = state.players[1].privileges;
      const result = doRefillBoard(state);
      expect(result.success).toBe(true);
      expect(state.players[1].privileges).toBe(opponentPrivilegesBefore + 1);
    });
  });

  describe('discardTokens', () => {
    it('应正确丢弃宝石', () => {
      const state = createTestState();
      state.turnPhase = 'DiscardExcess';
      state.players[0].inventory[GemType.Blue] = 8;
      state.players[0].inventory[GemType.Red] = 5;

      const result = discardTokens(state, { [GemType.Blue]: 3 });
      expect(result.success).toBe(true);
      expect(state.players[0].inventory[GemType.Blue]).toBe(5);
    });

    it('丢弃后仍超过上限应失败', () => {
      const state = createTestState();
      state.turnPhase = 'DiscardExcess';
      state.players[0].inventory[GemType.Blue] = 8;
      state.players[0].inventory[GemType.Red] = 5;
      // 总共 13，需要丢弃 3 个，只丢 1 个不够
      const result = discardTokens(state, { [GemType.Blue]: 1 });
      expect(result.success).toBe(false);
    });

    it('非 DiscardExcess 阶段不能丢弃', () => {
      const state = createTestState();
      state.turnPhase = 'Main';
      const result = discardTokens(state, { [GemType.Blue]: 1 });
      expect(result.success).toBe(false);
    });
  });
});
