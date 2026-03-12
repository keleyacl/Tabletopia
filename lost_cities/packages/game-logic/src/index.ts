// ============================================================
// 失落的城市 - Game Logic 包统一导出
// ============================================================

// 游戏初始化
export {
  shuffle,
  createDeck,
  dealHands,
  createEmptyExpeditions,
  createEmptyDiscards,
  createRoundState,
  createGameState,
} from './gameInit.js';

// 计分逻辑
export {
  scoreExpedition,
  scoreAll,
  calcMatchWins,
  roundWinner,
  isGameOver,
} from './gameScoring.js';

// 游戏动作
export {
  canPlayToExpedition,
  getPlayerView,
  applyAction,
} from './gameActions.js';

// 工具函数
export {
  cloneState,
  getTopDiscard,
} from './utils.js';
