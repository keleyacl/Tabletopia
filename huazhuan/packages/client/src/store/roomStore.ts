import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RoomInfo } from '@azul/shared';

// ============================================================
// 房间状态 Store
// ============================================================

export interface RoomStoreState {
  /** 房间信息 */
  roomInfo: RoomInfo | null;
  /** 当前玩家 ID */
  myPlayerId: string;
  /** 当前玩家名称 */
  myPlayerName: string;
  /** 是否为房主 */
  isHost: boolean;
  /** 游戏是否已开始 */
  gameStarted: boolean;
  /** 是否已连接到服务器 */
  isConnected: boolean;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误消息 */
  errorMessage: string | null;
}

export interface RoomStoreActions {
  /** 设置连接状态 */
  setConnected: (connected: boolean) => void;
  /** 设置玩家名称 */
  setPlayerName: (name: string) => void;
  /** 设置房间信息（创建/加入成功后） */
  setRoomInfo: (roomInfo: RoomInfo, playerId: string) => void;
  /** 更新房间信息（有人加入/离开） */
  updateRoomInfo: (roomInfo: RoomInfo) => void;
  /** 标记游戏已开始 */
  setGameStarted: () => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误消息 */
  setError: (message: string | null) => void;
  /** 重置房间状态 */
  resetRoom: () => void;
}

const initialState: RoomStoreState = {
  roomInfo: null,
  myPlayerId: '',
  myPlayerName: '',
  isHost: false,
  gameStarted: false,
  isConnected: false,
  isLoading: false,
  errorMessage: null,
};

export const useRoomStore = create<RoomStoreState & RoomStoreActions>()(
  immer((set) => ({
    ...initialState,

    setConnected: (connected: boolean) => {
      set((state) => {
        state.isConnected = connected;
      });
    },

    setPlayerName: (name: string) => {
      set((state) => {
        state.myPlayerName = name;
      });
    },

    setRoomInfo: (roomInfo: RoomInfo, playerId: string) => {
      set((state) => {
        state.roomInfo = roomInfo;
        state.myPlayerId = playerId;
        state.isHost = roomInfo.hostId === playerId;
        state.gameStarted = roomInfo.gameStarted;
        state.isLoading = false;
        state.errorMessage = null;
      });
    },

    updateRoomInfo: (roomInfo: RoomInfo) => {
      set((state) => {
        state.roomInfo = roomInfo;
        state.isHost = roomInfo.hostId === state.myPlayerId;
        state.gameStarted = roomInfo.gameStarted;
      });
    },

    setGameStarted: () => {
      set((state) => {
        state.gameStarted = true;
        if (state.roomInfo) {
          state.roomInfo.gameStarted = true;
        }
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (message: string | null) => {
      set((state) => {
        state.errorMessage = message;
        state.isLoading = false;
      });
      // 5 秒后自动清除错误
      if (message) {
        setTimeout(() => {
          set((state) => {
            state.errorMessage = null;
          });
        }, 5000);
      }
    },

    resetRoom: () => {
      set(() => ({ ...initialState }));
    },
  }))
);
