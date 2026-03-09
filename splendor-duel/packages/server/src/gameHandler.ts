// ============================================================
// 璀璨宝石·对决 - 游戏处理器
// 接收客户端动作，调用 game-logic 处理，返回结果
// ============================================================

import { GameAction, GameState } from '@splendor/shared';
import {
  takeTokens,
  reserveCard,
  purchaseCard,
  usePrivilege,
  doRefillBoard,
  discardTokens,
  resolveAbility,
  skipOptionalPhase,
} from '@splendor/game-logic';

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
  playerIndex: 0 | 1
): { success: boolean; error?: string } {
  // 验证是否是当前玩家的回合
  if (state.currentPlayerIndex !== playerIndex) {
    return { success: false, error: '不是你的回合' };
  }

  // 游戏已结束
  if (state.winner !== null) {
    return { success: false, error: '游戏已结束' };
  }

  switch (action.type) {
    case 'TakeTokens':
      return takeTokens(state, action.coords);

    case 'ReserveCard':
      return reserveCard(state, action.cardId);

    case 'PurchaseCard':
      return purchaseCard(state, action.cardId);

    case 'UsePrivilege':
      return usePrivilege(state, action.coord);

    case 'RefillBoard':
      return doRefillBoard(state);

    case 'DiscardTokens':
      return discardTokens(state, action.tokens);

    case 'ResolveAbility':
      return resolveAbility(state, action);

    case 'EndTurn':
      skipOptionalPhase(state);
      return { success: true };

    default:
      return { success: false, error: '未知的动作类型' };
  }
}
