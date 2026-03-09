// ============================================================
// 失落的城市 - 游戏处理器
// 接收客户端动作，调用 game-logic 处理，返回结果
// ============================================================

import { GameAction, GameState, ActionResult } from '@lost-cities/shared';
import { applyAction } from '@lost-cities/game-logic';

/**
 * 处理游戏动作
 * @param state 当前游戏状态（会被原地修改）
 * @param action 玩家动作
 * @param playerIndex 执行动作的玩家索引
 * @returns 处理结果
 */
export function handleGameAction(
  state: GameState,
  action: GameAction,
  playerIndex: number
): ActionResult {
  return applyAction(state, playerIndex, action);
}
