// ============================================================
// 斋浦尔 - 房间状态 Store
// ============================================================

import { useGameStore } from './gameStore';

/**
 * 获取房间状态
 */
export const useRoomState = () => {
  return useGameStore((state) => state.roomState);
};

/**
 * 判断是否轮到自己
 */
export const useIsMyTurn = () => {
  return useGameStore((state) => {
    if (!state.gameState || state.playerIndex === null) return false;
    return state.gameState.currentPlayerIndex === state.playerIndex;
  });
};

/**
 * 获取当前玩家索引
 */
export const usePlayerIndex = () => {
  return useGameStore((state) => state.playerIndex);
};