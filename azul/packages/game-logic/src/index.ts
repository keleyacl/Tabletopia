// 游戏初始化
export {
  createInitialBag,
  shuffleBag,
  drawTiles,
  fillFactories,
  createPlayerBoard,
  initializeGame,
  prepareNewRound,
} from './gameInit.js';

// 玩家行动
export {
  validatePlacement,
  getValidPlacements,
  placeTilesOnPatternLine,
  takeTilesFromFactory,
  takeTilesFromCenter,
  isPickingPhaseOver,
} from './gameActions.js';

// 计分逻辑
export {
  calculateTileScore,
  calculateFloorPenalty,
  tilePatternLinesToWall,
  scoreRound,
  checkGameEnd,
  calculateEndGameBonus,
  calculateFinalScores,
} from './gameScoring.js';
