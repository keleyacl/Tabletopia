// ============================================================
// 璀璨宝石·对决 - 房间状态 Store
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RoomListItem, JoinRequest, RoomVisibility, RoomInfo } from '@splendor/shared';

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
  /** 玩家名称 */
  playerName: string;
  /** 是否为房主 */
  isHost: boolean;
  /** 房间信息 */
  roomInfo: RoomInfo | null;
  /** 公开房间列表 */
  roomList: RoomListItem[];
  /** 房间列表加载中 */
  roomListLoading: boolean;
  /** 待处理的加入申请（申请者视角） */
  pendingJoinRequest: { roomId: string; status: 'pending' | 'approved' | 'rejected' } | null;
  /** 收到的加入申请（房主视角） */
  incomingJoinRequest: JoinRequest | null;
  /** 是否显示加入申请弹窗 */
  showJoinRequestModal: boolean;
  /** 房间可见性 */
  roomVisibility: RoomVisibility;
  /** 重连令牌 */
  reconnectToken: string | null;
}

interface RoomStore extends RoomState {
  setRoom: (roomId: string, playerId: 0 | 1) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setOpponentConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setPlayerName: (name: string) => void;
  setIsHost: (isHost: boolean) => void;
  setRoomInfo: (info: RoomInfo | null) => void;
  setRoomList: (rooms: RoomListItem[]) => void;
  setRoomListLoading: (loading: boolean) => void;
  setPendingJoinRequest: (request: { roomId: string; status: 'pending' | 'approved' | 'rejected' } | null) => void;
  setIncomingJoinRequest: (request: JoinRequest | null) => void;
  setShowJoinRequestModal: (show: boolean) => void;
  setRoomVisibility: (visibility: RoomVisibility) => void;
  setReconnectToken: (token: string | null) => void;
  reset: () => void;
}

const initialState: RoomState = {
  roomId: null,
  playerId: null,
  connectionStatus: 'disconnected',
  opponentConnected: false,
  error: null,
  playerName: '',
  isHost: false,
  roomInfo: null,
  roomList: [],
  roomListLoading: false,
  pendingJoinRequest: null,
  incomingJoinRequest: null,
  showJoinRequestModal: false,
  roomVisibility: 'public',
  reconnectToken: null,
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
      if (error) {
        setTimeout(() => {
          set((state) => { state.error = null; });
        }, 5000);
      }
    },

    setPlayerName: (name: string) => {
      set((state) => {
        state.playerName = name;
      });
    },

    setIsHost: (isHost: boolean) => {
      set((state) => {
        state.isHost = isHost;
      });
    },

    setRoomInfo: (info) => {
      set((state) => {
        state.roomInfo = info;
      });
    },

    setRoomList: (rooms: RoomListItem[]) => {
      set((state) => {
        state.roomList = rooms;
        state.roomListLoading = false;
      });
    },

    setRoomListLoading: (loading: boolean) => {
      set((state) => {
        state.roomListLoading = loading;
      });
    },

    setPendingJoinRequest: (request) => {
      set((state) => {
        state.pendingJoinRequest = request;
      });
    },

    setIncomingJoinRequest: (request) => {
      set((state) => {
        state.incomingJoinRequest = request;
      });
    },

    setShowJoinRequestModal: (show: boolean) => {
      set((state) => {
        state.showJoinRequestModal = show;
      });
    },

    setRoomVisibility: (visibility: RoomVisibility) => {
      set((state) => {
        state.roomVisibility = visibility;
      });
    },

    setReconnectToken: (token: string | null) => {
      set((state) => {
        state.reconnectToken = token;
      });
    },

    reset: () => {
      set(() => ({ ...initialState }));
    },
  }))
);
