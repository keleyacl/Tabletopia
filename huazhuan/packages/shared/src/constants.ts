import { TileColor, STANDARD_COLORS } from './types';

// ============================================================
// 花砖物语 (Azul) - 游戏常量
// ============================================================

/** 每种颜色的瓷砖总数 */
export const TILES_PER_COLOR = 20;

/** 每个工厂放置的瓷砖数量 */
export const TILES_PER_FACTORY = 4;

/** 模式线行数（也是墙面的行列数） */
export const BOARD_SIZE = 5;

/** 地板线最大容量 */
export const FLOOR_LINE_SIZE = 7;

/**
 * 地板线扣分数组
 * 第 1-2 个瓷砖各扣 1 分，第 3-5 个各扣 2 分，第 6-7 个各扣 3 分
 */
export const FLOOR_PENALTIES: number[] = [-1, -1, -2, -2, -2, -3, -3];

/** 终局加分：完成一整行 */
export const BONUS_COMPLETE_ROW = 2;

/** 终局加分：完成一整列 */
export const BONUS_COMPLETE_COL = 7;

/** 终局加分：收集齐某种颜色的全部 5 块 */
export const BONUS_COMPLETE_COLOR = 10;

/** 最少玩家数 */
export const MIN_PLAYERS = 2;

/** 最多玩家数 */
export const MAX_PLAYERS = 4;

/**
 * 根据玩家人数计算工厂数量
 * 公式：2 * N + 1
 */
export function getFactoryCount(playerCount: number): number {
  return 2 * playerCount + 1;
}

/**
 * 墙面颜色映射矩阵（5x5）
 * 每一行的颜色是循环位移的
 * Row 0: [Blue, Yellow, Red, Black, White]
 * Row 1: [White, Blue, Yellow, Red, Black]
 * Row 2: [Black, White, Blue, Yellow, Red]
 * Row 3: [Red, Black, White, Blue, Yellow]
 * Row 4: [Yellow, Red, Black, White, Blue]
 *
 * 公式：WALL_PATTERN[row][col] = STANDARD_COLORS[(col + row) % 5]
 * 但注意位移方向：实际是向右循环位移，即第 row 行第 col 列的颜色
 * 等于 STANDARD_COLORS[(col - row + 5) % 5]
 * 这里我们直接用标准 Azul 规则的映射
 */
export const WALL_PATTERN: TileColor[][] = Array.from({ length: BOARD_SIZE }, (_, row) =>
  Array.from({ length: BOARD_SIZE }, (_, col) => {
    // 标准 Azul 墙面：每行向右位移一位
    // Row 0: B Y R K W
    // Row 1: W B Y R K
    // 即 color = STANDARD_COLORS[(col - row + BOARD_SIZE) % BOARD_SIZE]
    const colorIndex = ((col - row) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE;
    return STANDARD_COLORS[colorIndex];
  })
);

/**
 * 获取指定颜色在墙面某行中的列位置
 * @param row 行索引 (0-4)
 * @param color 瓷砖颜色
 * @returns 列索引 (0-4)，如果颜色无效返回 -1
 */
export function getWallColumnForColor(row: number, color: TileColor): number {
  if (color === TileColor.FirstPlayer) return -1;
  const colorIndex = STANDARD_COLORS.indexOf(color);
  if (colorIndex === -1) return -1;
  // 反推列位置：col = (colorIndex + row) % BOARD_SIZE
  return (colorIndex + row) % BOARD_SIZE;
}

/**
 * 获取墙面某行某列对应的颜色
 * @param row 行索引 (0-4)
 * @param col 列索引 (0-4)
 * @returns 对应的瓷砖颜色
 */
export function getWallColorAt(row: number, col: number): TileColor {
  return WALL_PATTERN[row][col];
}
