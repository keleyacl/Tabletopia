// 导出初始化函数
export {
  createDeck,
  initializeTokens,
  initializeBonusTokens,
  initializeGame,
  initializeNewRound,
} from './gameInit.js';

// 导出游戏动作函数
export {
  refillMarket,
  switchTurn,
  takeOne,
  takeCamels,
  exchange,
  sellGoods,
  applyAction,
} from './gameActions.js';

// 导出结束判断函数
export {
  checkGameEnd,
  calculateFinalScores,
  getPlayerView,
} from './gameEnd.js';

// 导出工具函数
export { shuffle, cloneState } from './utils.js';
