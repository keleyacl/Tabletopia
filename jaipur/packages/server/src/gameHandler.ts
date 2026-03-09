// ============================================================
// 斋浦尔 - 游戏动作处理器
// ============================================================

import { GameAction, GameState, ActionResult } from '@jaipur/shared';
import { applyAction } from '@jaipur/game-logic';

interface Room {
  roomCode: string;
  players: Map<string, any>;
  gameState: GameState | null;
  createdAt: Date;
}

/**
 * 处理游戏动作
 * @param room 房间对象
 * @param socketId 发起动作的 socket ID
 * @param action 游戏动作
 * @returns 处理结果
 */
export function handleGameAction(
  room: Room,
  socketId: string,
  action: GameAction
): { success: boolean; result?: ActionResult; error?: string } {
  if (!room.gameState) {
    return { success: false, error: '游戏未开始' };
  }

  // 获取玩家信息
  const player = room.players.get(socketId);
  if (!player) {
    return { success: false, error: '玩家不存在' };
  }

  // 验证是否轮到该玩家
  if (room.gameState.currentPlayerIndex !== player.playerIndex) {
    return { success: false, error: '不是你的回合' };
  }

  // 调用 game-logic 处理动作
  const result = applyAction(room.gameState, action);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 更新游戏状态
  room.gameState = result.state!;

  return { success: true, result };
}
