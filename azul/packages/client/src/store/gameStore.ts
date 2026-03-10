import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  GameState,
  TileColor,
  RoundScoreDetail,
  FinalScoreDetail,
  RestartVoteInfo,
} from '@azul/shared';
import { getValidPlacements } from '@azul/game-logic';

// ============================================================
// 游戏状态 Store
// ============================================================

/** 选中的瓷砖信息 */
export interface SelectedTiles {
  /** 来源类型 */
  source: 'factory' | 'center';
  /** 工厂索引（仅 source 为 factory 时有效） */
  factoryIndex?: number;
  /** 选中的颜色 */
  color: TileColor;
  /** 选中的瓷砖数量 */
  count: number;
}

export interface GameStoreState {
  /** 游戏状态（从服务端同步） */
  gameState: GameState | null;
  /** 当前选中的瓷砖 */
  selectedTiles: SelectedTiles | null;
  /** 合法的放置位置（模式线行索引数组，-1 表示地板线） */
  validPlacements: number[];
  /** 当前玩家 ID */
  myPlayerId: string;
  /** 回合计分明细 */
  roundScoreDetails: RoundScoreDetail[] | null;
  /** 最终计分明细 */
  finalScores: FinalScoreDetail[] | null;
  /** 是否显示回合计分动画 */
  showRoundScore: boolean;
  /** 是否显示游戏结束弹窗 */
  showGameOver: boolean;
  /** 错误消息 */
  errorMessage: string | null;
  /** 重新开始投票状态 */
  restartVote: RestartVoteInfo | null;
}

export interface GameStoreActions {
  /** 设置当前玩家 ID */
  setMyPlayerId: (playerId: string) => void;
  /** 更新游戏状态 */
  updateGameState: (gameState: GameState) => void;
  /** 选择瓷砖 */
  selectTiles: (selection: SelectedTiles) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 设置回合计分明细 */
  setRoundScoreDetails: (details: RoundScoreDetail[]) => void;
  /** 设置最终计分 */
  setFinalScores: (scores: FinalScoreDetail[]) => void;
  /** 关闭回合计分显示 */
  dismissRoundScore: () => void;
  /** 显示游戏结束弹窗 */
  showGameOverModal: () => void;
  /** 关闭游戏结束弹窗 */
  dismissGameOver: () => void;
  /** 设置错误消息 */
  setError: (message: string | null) => void;
  /** 设置重新开始投票状态 */
  setRestartVote: (vote: RestartVoteInfo | null) => void;
  /** 清除重新开始投票状态 */
  clearRestartVote: () => void;
  /** 重置游戏状态 */
  resetGame: () => void;
}

const initialState: GameStoreState = {
  gameState: null,
  selectedTiles: null,
  validPlacements: [],
  myPlayerId: '',
  roundScoreDetails: null,
  finalScores: null,
  showRoundScore: false,
  showGameOver: false,
  errorMessage: null,
  restartVote: null,
};

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set, get) => ({
    ...initialState,

    setMyPlayerId: (playerId: string) => {
      set((state) => {
        state.myPlayerId = playerId;
      });
    },

    updateGameState: (gameState: GameState) => {
      set((state) => {
        state.gameState = gameState;
        // 清除之前的选择
        state.selectedTiles = null;
        state.validPlacements = [];
      });
    },

    selectTiles: (selection: SelectedTiles) => {
      const { gameState, myPlayerId } = get();
      if (!gameState) return;

      // 找到当前玩家
      const player = gameState.players.find((p) => p.id === myPlayerId);
      if (!player) return;

      // 计算合法放置位置
      const validPlacements = getValidPlacements(player, selection.color);

      set((state) => {
        state.selectedTiles = selection;
        state.validPlacements = validPlacements;
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedTiles = null;
        state.validPlacements = [];
      });
    },

    setRoundScoreDetails: (details: RoundScoreDetail[]) => {
      set((state) => {
        state.roundScoreDetails = details;
        state.showRoundScore = true;
      });
    },

    setFinalScores: (scores: FinalScoreDetail[]) => {
      set((state) => {
        state.finalScores = scores;
      });
    },

    dismissRoundScore: () => {
      set((state) => {
        state.showRoundScore = false;
        state.roundScoreDetails = null;
      });
    },

    showGameOverModal: () => {
      set((state) => {
        state.showGameOver = true;
      });
    },

    dismissGameOver: () => {
      set((state) => {
        state.showGameOver = false;
      });
    },

    setError: (message: string | null) => {
      set((state) => {
        state.errorMessage = message;
      });
      // 3 秒后自动清除错误
      if (message) {
        setTimeout(() => {
          set((state) => {
            state.errorMessage = null;
          });
        }, 3000);
      }
    },

    setRestartVote: (vote: RestartVoteInfo | null) => {
      set((state) => {
        state.restartVote = vote;
      });
    },

    clearRestartVote: () => {
      set((state) => {
        state.restartVote = null;
      });
    },

    resetGame: () => {
      set(() => ({ ...initialState }));
    },
  }))
);
