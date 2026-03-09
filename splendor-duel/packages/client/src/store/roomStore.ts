// ============================================================
// 璀璨宝石·对决 - 房间状态 Store
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface RoomState {
  /** 房间 ID */
  roomId: string | null;
  /** 玩家 ID（0 或 1） */
  playerId: 0 | 1 | null;
  /** 连接状态 */
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  /** 对手是否已连接 */
  opponentConnected: boolean;
  /** 错误信息 */
  error: string | null;
}

interface RoomStore extends RoomState {
  /** 设置房间信息 */
  setRoom: (roomId: string, playerId: 0 | 1) => void;
  /** 设置连接状态 */
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  /** 设置对手连接状态 */
  setOpponentConnected: (connected: boolean) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 重置房间状态 */
  reset: () => void;
}

const initialState: RoomState = {
  roomId: null,
  playerId: null,
  connectionStatus: 'disconnected',
  opponentConnected: false,
  error: null,
};

export const useRoomStore = create<RoomStore>()(
  immer((set) => ({
    ...initialState,

    setRoom: (roomId: string, playerId: 0 | 1) => {
      set((state) => {
        state.roomId = roomId;
        state.playerId = playerId;
      });
    },

    setConnectionStatus: (status) => {
      set((state) => {
        state.connectionStatus = status;
      });
    },

    setOpponentConnected: (connected) => {
      set((state) => {
        state.opponentConnected = connected;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },

    reset: () => {
      set(() => ({ ...initialState }));
    },
  }))
);
