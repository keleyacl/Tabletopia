// ============================================================
// 斋浦尔 - 游戏状态 Store (Zustand + Immer)
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  PlayerView,
  GameAction,
  TradeGoodType,
  ChatMessage,
  RoomListItem,
  JoinRequest,
  RoomVisibility,
} from '@jaipur/shared';
import { socketService } from '../services/socketService';

// ============================================================
// Toast 类型
// ============================================================

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

// ============================================================
// Store 接口
// ============================================================

interface GameStore {
  // --- 连接状态 ---
  connected: boolean;
  name: string;
  roomCode: string | null;
  reconnectToken: string | null;
  playerIndex: 0 | 1 | null;

  // --- 游戏状态 ---
  gameState: PlayerView | null;
  roomState: 'idle' | 'waiting' | 'playing' | 'round_over' | 'finished';

  // --- UI 交互状态 ---
  selectedMarketIndices: number[];
  selectedHandIndices: number[];
  selectedCamelCount: number;

  // --- 通知与聊天 ---
  toasts: Toast[];
  chatMessages: ChatMessage[];
  actionHistory: string[];

  // --- 大厅状态 ---
  roomList: RoomListItem[];
  roomListLoading: boolean;
  pendingJoinRequest: { roomCode: string; status: 'pending' | 'approved' | 'rejected' } | null;
  incomingJoinRequest: JoinRequest | null;
  showJoinRequestModal: boolean;
  roomVisibility: RoomVisibility;

  // --- 弹窗控制 ---
  showRulesModal: boolean;
  showGameMenu: boolean;

  // --- 动作方法 ---
  setName: (name: string) => void;
  connect: () => void;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  fetchRoomList: () => void;
  sendJoinRequest: (roomCode: string) => void;
  cancelJoinRequest: () => void;
  respondToJoinRequest: (requestId: string, approved: boolean) => void;
  setRoomVisibility: (visibility: RoomVisibility) => void;
  reconnect: () => void;
  toggleMarketSelection: (index: number) => void;
  toggleHandSelection: (index: number) => void;
  setCamelCount: (count: number) => void;
  clearSelection: () => void;
  takeOne: () => void;
  takeCamels: () => void;
  exchange: () => void;
  sellGoods: (goodType: TradeGoodType, count: number) => void;
  nextRound: () => void;
  rematch: () => void;
  sendChatMessage: (content: string) => void;
  addToast: (message: string, type?: 'info' | 'error' | 'success') => void;
  removeToast: (id: string) => void;
  toggleRulesModal: () => void;
  toggleGameMenu: () => void;
}

// ============================================================
// Store 实现
// ============================================================

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // --- 初始状态 ---
    connected: false,
    name: '',
    roomCode: null,
    reconnectToken: null,
    playerIndex: null,
    gameState: null,
    roomState: 'idle',
    selectedMarketIndices: [],
    selectedHandIndices: [],
    selectedCamelCount: 0,
    toasts: [],
    chatMessages: [],
    actionHistory: [],
    showRulesModal: false,
    showGameMenu: false,
    roomList: [],
    roomListLoading: false,
    pendingJoinRequest: null,
    incomingJoinRequest: null,
    showJoinRequestModal: false,
    roomVisibility: 'public' as RoomVisibility,

    // --- 动作方法 ---

    setName: (name: string) => {
      set((s) => {
        s.name = name;
      });
    },

    connect: () => {
      // 先初始化 socket（不连接），注册所有事件监听器后再连接
      // 这样可以避免 connect 事件在监听器注册前触发的竞态问题
      const rawSocket = (socketService as any).init ? socketService.init() : null;

      // 连接/断开事件（原生 socket.io 事件，不走类型化接口）
      if (rawSocket) {
        rawSocket.on('connect', () => {
          set((s) => { s.connected = true; });
          console.log('[Store] Socket 已连接');

          // 自动重连：如果有 reconnectToken，说明之前在游戏中断线，自动尝试重连
          const { reconnectToken } = get();
          if (reconnectToken) {
            console.log('[Store] 检测到 reconnectToken，自动尝试重连...');
            socketService.emit('room:reconnect', { reconnectToken });
          }
        });
        rawSocket.on('disconnect', () => {
          set((s) => { s.connected = false; });
          console.log('[Store] Socket 已断开');
        });
      }

      // 房间事件
      socketService.on('room:created', (data) => {
        set((s) => {
          s.roomCode = data.roomCode;
          s.playerIndex = data.playerIndex;
          s.reconnectToken = data.reconnectToken;
          s.roomState = 'waiting';
        });
      });

      socketService.on('room:joined', (data) => {
        set((s) => {
          s.roomCode = data.roomCode;
          s.playerIndex = data.playerIndex;
          s.reconnectToken = data.reconnectToken;
          s.roomState = 'waiting';
        });
      });

      socketService.on('room:player_joined', (data) => {
        get().addToast(`${data.name} 已加入房间`, 'info');
      });

      socketService.on('room:player_disconnected', (data) => {
        get().addToast(`${data.name} 已断开连接`, 'info');
      });

      socketService.on('room:player_reconnected', (data) => {
        get().addToast(`${data.name} 已重新连接`, 'success');
      });

      // 游戏事件
      socketService.on('game:started', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.roomState = 'playing';
        });
      });

      socketService.on('game:state_update', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.selectedMarketIndices = [];
          s.selectedHandIndices = [];
          s.selectedCamelCount = 0;
        });
      });

      socketService.on('game:error', (data) => {
        get().addToast(data.message, 'error');
      });

      socketService.on('game:round_ended', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.roomState = 'round_over';
        });
      });

      socketService.on('game:new_round', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.roomState = 'playing';
          s.selectedMarketIndices = [];
          s.selectedHandIndices = [];
          s.selectedCamelCount = 0;
        });
      });

      socketService.on('game:match_ended', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.roomState = 'finished';
        });
      });

      socketService.on('game:rematch_started', (data) => {
        set((s) => {
          s.gameState = data.playerView;
          s.roomState = 'playing';
          s.selectedMarketIndices = [];
          s.selectedHandIndices = [];
          s.selectedCamelCount = 0;
        });
      });

      // 聊天事件
      socketService.on('chat:message', (data) => {
        set((s) => {
          s.chatMessages.push(data);
        });
      });

      // ============================================================
      // 大厅事件
      // ============================================================

      // 收到房间列表
      socketService.on('lobby:room_list', (data) => {
        console.log(`[Store] 收到房间列表更新: ${data.rooms.length} 个房间`, JSON.stringify(data.rooms));
        console.log(`[Store] 当前 roomState: ${get().roomState}`);
        set((s) => {
          s.roomList = data.rooms;
          s.roomListLoading = false;
        });
      });

      // 房主收到加入申请
      socketService.on('lobby:join_request_received', (data) => {
        set((s) => {
          s.incomingJoinRequest = data;
          s.showJoinRequestModal = true;
        });
      });

      // 申请被同意
      socketService.on('lobby:join_approved', (data) => {
        set((s) => {
          s.roomCode = data.roomCode;
          s.playerIndex = data.playerIndex;
          s.reconnectToken = data.reconnectToken;
          s.roomState = 'waiting';
          s.pendingJoinRequest = null;
        });
        get().addToast('房主已同意你的加入申请', 'success');
      });

      // 申请被拒绝
      socketService.on('lobby:join_rejected', (data) => {
        set((s) => {
          s.pendingJoinRequest = null;
        });
        get().addToast(data.reason || '房主拒绝了你的加入申请', 'error');
      });

      // 申请被取消（房主视角）
      socketService.on('lobby:request_cancelled', (_data) => {
        set((s) => {
          s.incomingJoinRequest = null;
          s.showJoinRequestModal = false;
        });
        get().addToast('对方已取消加入申请', 'info');
      });

      // 所有事件监听器注册完毕后，再建立连接
      socketService.connect();
    },

    createRoom: () => {
      const { name, roomVisibility } = get();
      socketService.emit('room:create', { name, visibility: roomVisibility });
    },

    joinRoom: (roomCode: string) => {
      const { name } = get();
      socketService.emit('room:join', { name, roomCode });
    },

    reconnect: () => {
      const { reconnectToken } = get();
      if (reconnectToken) {
        socketService.emit('room:reconnect', { reconnectToken });
      }
    },

    toggleMarketSelection: (index: number) => {
      set((s) => {
        const idx = s.selectedMarketIndices.indexOf(index);
        if (idx !== -1) {
          s.selectedMarketIndices.splice(idx, 1);
        } else {
          s.selectedMarketIndices.push(index);
        }
      });
    },

    toggleHandSelection: (index: number) => {
      set((s) => {
        const idx = s.selectedHandIndices.indexOf(index);
        if (idx !== -1) {
          s.selectedHandIndices.splice(idx, 1);
        } else {
          s.selectedHandIndices.push(index);
        }
      });
    },

    setCamelCount: (count: number) => {
      set((s) => {
        s.selectedCamelCount = count;
      });
    },

    clearSelection: () => {
      set((s) => {
        s.selectedMarketIndices = [];
        s.selectedHandIndices = [];
        s.selectedCamelCount = 0;
      });
    },

    takeOne: () => {
      const { selectedMarketIndices } = get();
      if (selectedMarketIndices.length !== 1) return;

      const action: GameAction = {
        type: 'TAKE_ONE',
        marketIndex: selectedMarketIndices[0],
      };
      socketService.emit('game:action', { action });
    },

    takeCamels: () => {
      const action: GameAction = { type: 'TAKE_CAMELS' };
      socketService.emit('game:action', { action });
    },

    exchange: () => {
      const { selectedMarketIndices, selectedHandIndices, selectedCamelCount } = get();
      const action: GameAction = {
        type: 'EXCHANGE',
        marketIndices: [...selectedMarketIndices],
        handIndices: [...selectedHandIndices],
        camelCount: selectedCamelCount,
      };
      socketService.emit('game:action', { action });
    },

    sellGoods: (goodType: TradeGoodType, count: number) => {
      const action: GameAction = {
        type: 'SELL',
        goodType,
        count,
      };
      socketService.emit('game:action', { action });
    },

    nextRound: () => {
      socketService.emit('game:next_round');
    },

    rematch: () => {
      socketService.emit('game:rematch');
    },

    sendChatMessage: (content: string) => {
      socketService.emit('chat:message', { content });
    },

    addToast: (message: string, type: 'info' | 'error' | 'success' = 'info') => {
      set((s) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        s.toasts.push({ id, message, type });
      });
      // 3 秒后自动移除
      setTimeout(() => {
        const { toasts } = get();
        if (toasts.length > 0) {
          set((s) => {
            s.toasts.shift();
          });
        }
      }, 3000);
    },

    removeToast: (id: string) => {
      set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== id);
      });
    },

    // ============================================================
    // 大厅动作方法
    // ============================================================

    fetchRoomList: () => {
      console.log(`[Store] 请求获取房间列表, connected: ${socketService.connected}, roomState: ${get().roomState}`);
      set((s) => { s.roomListLoading = true; });
      socketService.emit('lobby:list');

      // 超时保护：3秒内未收到响应则自动恢复 loading 状态
      setTimeout(() => {
        const { roomListLoading } = get();
        if (roomListLoading) {
          set((s) => { s.roomListLoading = false; });
          console.warn('[Store] 获取房间列表超时');
        }
      }, 3000);
    },

    sendJoinRequest: (roomCode: string) => {
      const { name } = get();
      socketService.emit('lobby:join_request', { roomCode, name });
      set((s) => {
        s.pendingJoinRequest = { roomCode, status: 'pending' };
      });
    },

    cancelJoinRequest: () => {
      const { pendingJoinRequest } = get();
      if (pendingJoinRequest) {
        socketService.emit('lobby:cancel_request', { roomCode: pendingJoinRequest.roomCode });
        set((s) => {
          s.pendingJoinRequest = null;
        });
      }
    },

    respondToJoinRequest: (requestId: string, approved: boolean) => {
      socketService.emit('lobby:join_response', { requestId, approved });
      set((s) => {
        s.incomingJoinRequest = null;
        s.showJoinRequestModal = false;
      });
    },

    setRoomVisibility: (visibility: RoomVisibility) => {
      set((s) => {
        s.roomVisibility = visibility;
      });
    },

    toggleRulesModal: () => {
      set((s) => {
        s.showRulesModal = !s.showRulesModal;
      });
    },

    toggleGameMenu: () => {
      set((s) => {
        s.showGameMenu = !s.showGameMenu;
      });
    },
  })),
);
