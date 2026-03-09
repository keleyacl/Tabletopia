// ============================================================
// 璀璨宝石·对决 - 棋盘几何引擎 (BoardLogic)
// ============================================================

import {
  BoardSlot,
  Coord,
  GemType,
} from '@splendor/shared';
import { BOARD_SIZE, SPIRAL_ORDER } from '@splendor/shared';

// ============================================================
// 棋盘创建
// ============================================================

/** 创建 5x5 空棋盘 */
export function createEmptyBoard(): BoardSlot[][] {
  const board: BoardSlot[][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: BoardSlot[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push({ x, y, gem: null });
    }
    board.push(row);
  }
  return board;
}

// ============================================================
// 选取校验
// ============================================================

/**
 * 校验选中的坐标是否合法
 * 规则：
 * 1. 选取 1-3 个宝石
 * 2. 必须在水平、垂直或对角线上连续
 * 3. 中间无空位
 * 4. 不能选取黄金 (Gold)
 * 5. 所有坐标必须在棋盘范围内且有宝石
 */
export function validateSelection(
  board: BoardSlot[][],
  coords: Coord[]
): { valid: boolean; error?: string } {
  // 检查数量
  if (coords.length === 0 || coords.length > 3) {
    return { valid: false, error: '必须选取 1-3 个宝石' };
  }

  // 检查坐标范围和是否有宝石
  for (const coord of coords) {
    if (coord.x < 0 || coord.x >= BOARD_SIZE || coord.y < 0 || coord.y >= BOARD_SIZE) {
      return { valid: false, error: `坐标 (${coord.x}, ${coord.y}) 超出棋盘范围` };
    }
    const slot = board[coord.y][coord.x];
    if (slot.gem === null) {
      return { valid: false, error: `坐标 (${coord.x}, ${coord.y}) 没有宝石` };
    }
    if (slot.gem === GemType.Gold) {
      return { valid: false, error: '不能直接从棋盘选取黄金' };
    }
  }

  // 检查是否有重复坐标
  const coordSet = new Set(coords.map(c => `${c.x},${c.y}`));
  if (coordSet.size !== coords.length) {
    return { valid: false, error: '不能选取重复的坐标' };
  }

  // 单个宝石无需检查共线和相邻
  if (coords.length === 1) {
    return { valid: true };
  }

  // 检查共线
  if (!areCollinear(coords)) {
    return { valid: false, error: '选取的宝石必须在同一条直线上（水平、垂直或对角线）' };
  }

  // 检查相邻且连续（中间无空位）
  if (!areContiguous(board, coords)) {
    return { valid: false, error: '选取的宝石必须相邻且中间无空位' };
  }

  return { valid: true };
}

/**
 * 判断坐标是否共线（水平、垂直或对角线）
 */
export function areCollinear(coords: Coord[]): boolean {
  if (coords.length <= 1) return true;

  const dx = coords[1].x - coords[0].x;
  const dy = coords[1].y - coords[0].y;

  for (let i = 2; i < coords.length; i++) {
    const dxi = coords[i].x - coords[0].x;
    const dyi = coords[i].y - coords[0].y;
    // 叉积为 0 表示共线
    if (dx * dyi - dy * dxi !== 0) {
      return false;
    }
  }
  return true;
}

/**
 * 判断坐标是否相邻且连续（中间无空位）
 * 将坐标按方向排序后，检查每对相邻坐标间距为 1，且中间无空位
 */
export function areContiguous(board: BoardSlot[][], coords: Coord[]): boolean {
  if (coords.length <= 1) return true;

  // 按某个方向排序坐标
  const sorted = sortCoordsByDirection(coords);

  // 计算方向向量
  const dx = Math.sign(sorted[1].x - sorted[0].x);
  const dy = Math.sign(sorted[1].y - sorted[0].y);

  // 检查每对相邻坐标
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    // 检查间距是否为 1 步
    const stepX = next.x - curr.x;
    const stepY = next.y - curr.y;

    if (stepX !== dx || stepY !== dy) {
      return false;
    }

    // 检查中间位置是否有宝石（对于间距为 1 的情况，中间没有格子需要检查）
    // 但需要确保当前位置有宝石
    if (board[curr.y][curr.x].gem === null) {
      return false;
    }
  }

  // 检查最后一个位置
  const last = sorted[sorted.length - 1];
  if (board[last.y][last.x].gem === null) {
    return false;
  }

  return true;
}

/**
 * 按方向排序坐标（从左到右，从上到下，或从左上到右下）
 */
function sortCoordsByDirection(coords: Coord[]): Coord[] {
  return [...coords].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });
}

// ============================================================
// 棋盘操作
// ============================================================

/** 从棋盘移除选中宝石，返回被移除的宝石列表 */
export function removeGemsFromBoard(
  board: BoardSlot[][],
  coords: Coord[]
): GemType[] {
  const removed: GemType[] = [];
  for (const coord of coords) {
    const slot = board[coord.y][coord.x];
    if (slot.gem !== null) {
      removed.push(slot.gem);
      slot.gem = null;
    }
  }
  return removed;
}

/**
 * 按螺旋顺序从中心向外填充棋盘空位
 * @param board 棋盘
 * @param bag 宝石袋（会被修改，从中取出宝石）
 * @returns 填充的宝石数量
 */
export function refillBoard(board: BoardSlot[][], bag: GemType[]): number {
  let filled = 0;
  for (const coord of SPIRAL_ORDER) {
    if (bag.length === 0) break;
    const slot = board[coord.y][coord.x];
    if (slot.gem === null) {
      slot.gem = bag.pop()!;
      filled++;
    }
  }
  return filled;
}

/** 统计棋盘上的宝石数量 */
export function getBoardGemCount(board: BoardSlot[][]): number {
  let count = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].gem !== null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 检查选中宝石中同色的数量
 * 用于判断是否触发对手获得特权（3个同色宝石）
 */
export function checkSameColorCount(
  board: BoardSlot[][],
  coords: Coord[]
): { maxSameColor: number; color: GemType | null } {
  const colorCount: Partial<Record<GemType, number>> = {};
  for (const coord of coords) {
    const gem = board[coord.y][coord.x].gem;
    if (gem !== null) {
      colorCount[gem] = (colorCount[gem] || 0) + 1;
    }
  }

  let maxCount = 0;
  let maxColor: GemType | null = null;
  for (const [gem, count] of Object.entries(colorCount)) {
    if (count! > maxCount) {
      maxCount = count!;
      maxColor = gem as GemType;
    }
  }

  return { maxSameColor: maxCount, color: maxColor };
}

/** 获取棋盘上所有指定颜色宝石的坐标 */
export function getGemCoords(board: BoardSlot[][], gemType: GemType): Coord[] {
  const coords: Coord[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].gem === gemType) {
        coords.push({ x, y });
      }
    }
  }
  return coords;
}

/** 深拷贝棋盘 */
export function cloneBoard(board: BoardSlot[][]): BoardSlot[][] {
  return board.map(row => row.map(slot => ({ ...slot })));
}
