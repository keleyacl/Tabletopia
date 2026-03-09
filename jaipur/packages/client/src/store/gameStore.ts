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

  // --- 弹窗控制 ---
  showRulesModal: boolean;
  showGameMenu: boolean;

  // --- 动作方法 ---
  setName: (name: string) => void;
  connect: () => void;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
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

    // --- 动作方法 ---

    setName: (name: string) => {
      set((s) => {
        s.name = name;
      });
    },

    connect: () => {
      socketService.connect();

      // 连接/断开事件（原生 socket.io 事件，不走类型化接口）
      const rawSocket = (socketService as any).socket;
      if (rawSocket) {
        rawSocket.on('connect', () => {
          set((s) => { s.connected = true; });
        });
        rawSocket.on('disconnect', () => {
          set((s) => { s.connected = false; });
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
    },

    createRoom: () => {
      const { name } = get();
      socketService.emit('room:create', { name });
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
