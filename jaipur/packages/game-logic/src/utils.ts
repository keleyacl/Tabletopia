// ============================================================
// 斋浦尔 (Jaipur) - 工具函数
// ============================================================

import type { GameState } from '@jaipur/shared';

/**
 * Fisher-Yates 洗牌算法
 * 原地打乱数组顺序，返回同一个数组引用
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 深拷贝游戏状态
 * 使用 JSON 序列化实现完整的深拷贝
 */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}
