// ============================================================
// 璀璨宝石·对决 - 游戏状态 Store (Zustand + Immer)
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  GameState,
  Coord,
  GemType,
  ResolveAbilityAction,
} from '@splendor/shared';
import {
  createInitialState,
  takeTokens,
  reserveCard,
  purchaseCard,
  usePrivilege,
  doRefillBoard,
  discardTokens,
  resolveAbility,
  skipOptionalPhase,
  canUsePrivilege,
  canPerformMainAction,
  needsAbilityResolution,
  needsDiscard,
  getDiscardCount,
  getAvailableTakeTokenCoords,
  getAvailableRobTokenTypes,
  getAvailableCopyColors,
} from '@splendor/game-logic';

// ============================================================
// UI 状态接口
// ============================================================

interface UIState {
  /** 当前选中的棋盘坐标（用于拿取宝石） */
  selectedCoords: Coord[];
  /** 高亮的棋盘槽位（用于能力解决） */
  highlightedSlots: Coord[];
  /** 是否显示丢弃弹窗 */
  showDiscardModal: boolean;
  /** 是否显示胜利弹窗 */
  showVictoryOverlay: boolean;
  /** 操作消息提示 */
  message: string | null;
  /** 消息类型 */
  messageType: 'info' | 'error' | 'success';
}

// ============================================================
// Store 接口
// ============================================================

interface GameStore extends UIState {
  /** 游戏状态 */
  gameState: GameState;

  // --- 游戏动作 ---
  /** 初始化/重新开始游戏 */
  initGame: () => void;
  /** 选中/取消选中棋盘坐标 */
  toggleCoord: (coord: Coord) => void;
  /** 确认拿取选中的宝石 */
  confirmTakeTokens: () => void;
  /** 预留卡牌 */
  doReserveCard: (cardId: string) => void;
  /** 购买卡牌 */
  doPurchaseCard: (cardId: string) => void;
  /** 使用特权 */
  doUsePrivilege: (coord: Coord) => void;
  /** 重置棋盘 */
  doRefillBoard: () => void;
  /** 丢弃宝石 */
  doDiscardTokens: (tokens: Partial<Record<GemType, number>>) => void;
  /** 解决能力 */
  doResolveAbility: (action: ResolveAbilityAction) => void;
  /** 跳过可选阶段 */
  doSkipOptionalPhase: () => void;

  // --- 网络同步 ---
  /** 直接设置游戏状态（用于服务器同步） */
  setGameState: (state: GameState) => void;

  // --- UI 动作 ---
  /** 清除选中 */
  clearSelection: () => void;
  /** 设置消息 */
  setMessage: (message: string | null, type?: 'info' | 'error' | 'success') => void;
  /** 关闭丢弃弹窗 */
  closeDiscardModal: () => void;
  /** 关闭胜利弹窗 */
  closeVictoryOverlay: () => void;
}

// ============================================================
// Store 实现
// ============================================================

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // --- 初始状态 ---
    gameState: createInitialState(),
    selectedCoords: [],
    highlightedSlots: [],
    showDiscardModal: false,
    showVictoryOverlay: false,
    message: null,
    messageType: 'info',

    // --- 游戏动作 ---
    initGame: () => {
      set((state) => {
        state.gameState = createInitialState() as any;
        state.selectedCoords = [];
        state.highlightedSlots = [];
        state.showDiscardModal = false;
        state.showVictoryOverlay = false;
        state.message = null;
      });
    },

    toggleCoord: (coord: Coord) => {
      set((state) => {
        const idx = state.selectedCoords.findIndex(
          (c) => c.x === coord.x && c.y === coord.y
        );
        if (idx !== -1) {
          state.selectedCoords.splice(idx, 1);
        } else if (state.selectedCoords.length < 3) {
          state.selectedCoords.push(coord);
        }
      });
    },

    confirmTakeTokens: () => {
      set((state) => {
        const result = takeTokens(state.gameState as any, [...state.selectedCoords]);
        if (result.success) {
          state.selectedCoords = [];
          state.message = null;
          // 检查是否需要丢弃
          if (state.gameState.turnPhase === 'DiscardExcess') {
            state.showDiscardModal = true;
          }
          // 检查胜利
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doReserveCard: (cardId: string) => {
      set((state) => {
        const result = reserveCard(state.gameState as any, cardId);
        if (result.success) {
          state.message = '卡牌已预留';
          state.messageType = 'success';
          if (state.gameState.turnPhase === 'DiscardExcess') {
            state.showDiscardModal = true;
          }
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doPurchaseCard: (cardId: string) => {
      set((state) => {
        const result = purchaseCard(state.gameState as any, cardId);
        if (result.success) {
          state.message = '卡牌已购买';
          state.messageType = 'success';
          // 更新高亮（如果有待解决的能力）
          if (state.gameState.pendingAbility) {
            const pending = state.gameState.pendingAbility;
            if (pending.ability === 'TakeToken' && pending.bonusColor) {
              state.highlightedSlots = getAvailableTakeTokenCoords(
                state.gameState as any,
                pending.bonusColor
              );
            }
          }
          if (state.gameState.turnPhase === 'DiscardExcess') {
            state.showDiscardModal = true;
          }
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doUsePrivilege: (coord: Coord) => {
      set((state) => {
        const result = usePrivilege(state.gameState as any, coord);
        if (result.success) {
          state.message = '特权已使用';
          state.messageType = 'success';
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doRefillBoard: () => {
      set((state) => {
        const result = doRefillBoard(state.gameState as any);
        if (result.success) {
          state.message = '棋盘已重置';
          state.messageType = 'success';
          if (state.gameState.turnPhase === 'DiscardExcess') {
            state.showDiscardModal = true;
          }
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doDiscardTokens: (tokens: Partial<Record<GemType, number>>) => {
      set((state) => {
        const result = discardTokens(state.gameState as any, tokens);
        if (result.success) {
          state.showDiscardModal = false;
          state.message = null;
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doResolveAbility: (action: ResolveAbilityAction) => {
      set((state) => {
        const result = resolveAbility(state.gameState as any, action);
        if (result.success) {
          state.highlightedSlots = [];
          state.message = '能力已解决';
          state.messageType = 'success';
          // 推进阶段
          if (state.gameState.turnPhase === 'ResolveAbilities' && !state.gameState.pendingAbility) {
            state.gameState.turnPhase = 'OptionalAfter';
          }
          if (state.gameState.turnPhase === 'DiscardExcess') {
            state.showDiscardModal = true;
          }
          if (state.gameState.winner !== null) {
            state.showVictoryOverlay = true;
          }
        } else {
          state.message = result.error || '操作失败';
          state.messageType = 'error';
        }
      });
    },

    doSkipOptionalPhase: () => {
      set((state) => {
        skipOptionalPhase(state.gameState as any);
        if (state.gameState.turnPhase === 'DiscardExcess') {
          state.showDiscardModal = true;
        }
        if (state.gameState.winner !== null) {
          state.showVictoryOverlay = true;
        }
      });
    },

    // --- 网络同步 ---
    setGameState: (newGameState: GameState) => {
      set((state) => {
        state.gameState = newGameState as any;
        state.selectedCoords = [];
        state.highlightedSlots = [];
        state.showDiscardModal = false;
        if (newGameState.winner !== null) {
          state.showVictoryOverlay = true;
        }
      });
    },

    // --- UI 动作 ---
    clearSelection: () => {
      set((state) => {
        state.selectedCoords = [];
      });
    },

    setMessage: (message: string | null, type: 'info' | 'error' | 'success' = 'info') => {
      set((state) => {
        state.message = message;
        state.messageType = type;
      });
    },

    closeDiscardModal: () => {
      set((state) => {
        state.showDiscardModal = false;
      });
    },

    closeVictoryOverlay: () => {
      set((state) => {
        state.showVictoryOverlay = false;
      });
    },
  }))
);
