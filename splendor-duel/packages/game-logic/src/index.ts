// ============================================================
// 璀璨宝石·对决 - Game Logic 包统一导出
// ============================================================

// 棋盘逻辑
export {
  createEmptyBoard,
  validateSelection,
  areCollinear,
  areContiguous,
  removeGemsFromBoard,
  refillBoard,
  getBoardGemCount,
  checkSameColorCount,
  getGemCoords,
  cloneBoard,
} from './boardLogic.js';

// 经济引擎
export {
  calculateNetCost,
  calculateGoldNeeded,
  canAfford,
  calculatePayment,
  executePurchase,
  returnTokensToBag,
  getTotalTokenCount,
} from './economyEngine.js';

// 能力引擎
export {
  triggerAbility,
  resolveAbility,
  getAvailableTakeTokenCoords,
  getAvailableRobTokenTypes,
  getAvailableCopyColors,
} from './abilityEngine.js';

// 游戏初始化
export {
  shuffleArray,
  createEmptyPlayer,
  createInitialState,
  refillDisplay,
} from './gameInit.js';

// 回合管理
export {
  advancePhase,
  skipOptionalPhase,
  endTurn,
  canUsePrivilege,
  canPerformMainAction,
  needsAbilityResolution,
  needsDiscard,
  getDiscardCount,
} from './turnManager.js';

// 玩家动作
export {
  takeTokens,
  reserveCard,
  purchaseCard,
  usePrivilege,
  doRefillBoard,
  discardTokens,
} from './gameActions.js';

// 胜利判定
export {
  checkVictory,
  getVictoryDetails,
} from './victoryMonitor.js';
