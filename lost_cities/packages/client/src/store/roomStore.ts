// ============================================================
// 失落的城市 - 房间状态 Store
// 房间状态已集成到 gameStore 中，此文件提供便捷的选择器
// ============================================================

import { useGameStore } from './gameStore';

/** 获取房间状态的便捷 hook */
export function useRoomState() {
  return useGameStore((s) => s.roomState);
}

/** 获取连接状态的便捷 hook */
export function useConnectionStatus() {
  return useGameStore((s) => s.connected);
}

/** 获取房间码的便捷 hook */
export function useRoomCode() {
  return useGameStore((s) => s.roomState?.code ?? '');
}
