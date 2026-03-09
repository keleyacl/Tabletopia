// ============================================================
// 失落的城市 - 工具函数
// ============================================================

import { Card, Color, DiscardPiles, GameState } from '@lost-cities/shared';

/**
 * 深拷贝游戏状态
 */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * 获取弃牌堆顶牌
 */
export function getTopDiscard(discardPiles: DiscardPiles, color: Color): Card | null {
  const pile = discardPiles[color];
  if (!pile || pile.length === 0) return null;
  return pile[pile.length - 1];
}
