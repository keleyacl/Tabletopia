import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  validateSelection,
  areCollinear,
  areContiguous,
  refillBoard,
  getBoardGemCount,
  checkSameColorCount,
  removeGemsFromBoard,
} from '../boardLogic';
import { GemType, BoardSlot, Coord } from '@splendor/shared';
import { BOARD_SIZE, SPIRAL_ORDER } from '@splendor/shared';

/** 辅助函数：创建一个填满指定宝石的棋盘 */
function createFilledBoard(gem: GemType = GemType.Blue): BoardSlot[][] {
  const board = createEmptyBoard();
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      board[y][x].gem = gem;
    }
  }
  return board;
}

/** 辅助函数：在棋盘指定位置放置宝石 */
function placeGem(board: BoardSlot[][], x: number, y: number, gem: GemType): void {
  board[y][x].gem = gem;
}

describe('BoardLogic', () => {
  describe('createEmptyBoard', () => {
    it('应创建 5x5 的空棋盘', () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(5);
      for (const row of board) {
        expect(row.length).toBe(5);
        for (const slot of row) {
          expect(slot.gem).toBeNull();
        }
      }
    });

    it('每个槽位应有正确的坐标', () => {
      const board = createEmptyBoard();
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          expect(board[y][x].x).toBe(x);
          expect(board[y][x].y).toBe(y);
        }
      }
    });
  });

  describe('areCollinear', () => {
    it('单个坐标应返回 true', () => {
      expect(areCollinear([{ x: 0, y: 0 }])).toBe(true);
    });

    it('水平共线应返回 true', () => {
      expect(areCollinear([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }])).toBe(true);
    });

    it('垂直共线应返回 true', () => {
      expect(areCollinear([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }])).toBe(true);
    });

    it('对角线共线应返回 true', () => {
      expect(areCollinear([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }])).toBe(true);
    });

    it('反对角线共线应返回 true', () => {
      expect(areCollinear([{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }])).toBe(true);
    });

    it('非共线应返回 false', () => {
      expect(areCollinear([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }])).toBe(false);
    });

    it('L 形不共线应返回 false', () => {
      expect(areCollinear([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    });
  });

  describe('validateSelection', () => {
    it('选取 0 个宝石应失败', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, []);
      expect(result.valid).toBe(false);
    });

    it('选取超过 3 个宝石应失败', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      ]);
      expect(result.valid).toBe(false);
    });

    it('选取 1 个宝石应成功', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 2, y: 2 }]);
      expect(result.valid).toBe(true);
    });

    it('选取水平相邻的 2 个宝石应成功', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 1, y: 2 }, { x: 2, y: 2 }]);
      expect(result.valid).toBe(true);
    });

    it('选取水平相邻的 3 个宝石应成功', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result.valid).toBe(true);
    });

    it('选取对角线相邻的 3 个宝石应成功', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
      expect(result.valid).toBe(true);
    });

    it('选取空位应失败', () => {
      const board = createEmptyBoard();
      const result = validateSelection(board, [{ x: 0, y: 0 }]);
      expect(result.valid).toBe(false);
    });

    it('选取黄金应失败', () => {
      const board = createEmptyBoard();
      placeGem(board, 2, 2, GemType.Gold);
      const result = validateSelection(board, [{ x: 2, y: 2 }]);
      expect(result.valid).toBe(false);
    });

    it('选取不共线的宝石应失败', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);
      expect(result.valid).toBe(false);
    });

    it('选取有间隔的宝石应失败', () => {
      const board = createEmptyBoard();
      placeGem(board, 0, 0, GemType.Blue);
      // 跳过 (1,0)
      placeGem(board, 2, 0, GemType.Blue);
      const result = validateSelection(board, [{ x: 0, y: 0 }, { x: 2, y: 0 }]);
      expect(result.valid).toBe(false);
    });

    it('选取超出棋盘范围应失败', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: -1, y: 0 }]);
      expect(result.valid).toBe(false);
    });

    it('选取重复坐标应失败', () => {
      const board = createFilledBoard();
      const result = validateSelection(board, [{ x: 0, y: 0 }, { x: 0, y: 0 }]);
      expect(result.valid).toBe(false);
    });
  });

  describe('refillBoard', () => {
    it('应按螺旋顺序填充空棋盘', () => {
      const board = createEmptyBoard();
      const bag = [
        GemType.White, GemType.Blue, GemType.Green, GemType.Red, GemType.Black,
        GemType.White, GemType.Blue, GemType.Green, GemType.Red, GemType.Black,
        GemType.White, GemType.Blue, GemType.Green, GemType.Red, GemType.Black,
        GemType.White, GemType.Blue, GemType.Green, GemType.Red, GemType.Black,
        GemType.White, GemType.Blue, GemType.Green, GemType.Red, GemType.Black,
      ];

      const filled = refillBoard(board, bag);
      expect(filled).toBe(25);
      expect(bag.length).toBe(0);

      // 中心应该最先被填充（从袋子末尾取）
      expect(board[2][2].gem).toBe(GemType.Black);
    });

    it('袋子为空时不应填充', () => {
      const board = createEmptyBoard();
      const bag: GemType[] = [];
      const filled = refillBoard(board, bag);
      expect(filled).toBe(0);
    });

    it('不应覆盖已有宝石', () => {
      const board = createEmptyBoard();
      placeGem(board, 2, 2, GemType.Gold); // 中心已有宝石
      const bag = [GemType.Blue, GemType.Red];
      const filled = refillBoard(board, bag);
      expect(board[2][2].gem).toBe(GemType.Gold); // 不被覆盖
      expect(filled).toBe(2);
    });
  });

  describe('getBoardGemCount', () => {
    it('空棋盘应返回 0', () => {
      const board = createEmptyBoard();
      expect(getBoardGemCount(board)).toBe(0);
    });

    it('满棋盘应返回 25', () => {
      const board = createFilledBoard();
      expect(getBoardGemCount(board)).toBe(25);
    });
  });

  describe('checkSameColorCount', () => {
    it('3 个同色宝石应返回 maxSameColor=3', () => {
      const board = createEmptyBoard();
      placeGem(board, 0, 0, GemType.Blue);
      placeGem(board, 1, 0, GemType.Blue);
      placeGem(board, 2, 0, GemType.Blue);
      const result = checkSameColorCount(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result.maxSameColor).toBe(3);
      expect(result.color).toBe(GemType.Blue);
    });

    it('3 个不同色宝石应返回 maxSameColor=1', () => {
      const board = createEmptyBoard();
      placeGem(board, 0, 0, GemType.Blue);
      placeGem(board, 1, 0, GemType.Red);
      placeGem(board, 2, 0, GemType.Green);
      const result = checkSameColorCount(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result.maxSameColor).toBe(1);
    });
  });

  describe('removeGemsFromBoard', () => {
    it('应正确移除宝石并返回列表', () => {
      const board = createEmptyBoard();
      placeGem(board, 0, 0, GemType.Blue);
      placeGem(board, 1, 0, GemType.Red);
      const removed = removeGemsFromBoard(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
      expect(removed).toEqual([GemType.Blue, GemType.Red]);
      expect(board[0][0].gem).toBeNull();
      expect(board[0][1].gem).toBeNull();
    });
  });
});
