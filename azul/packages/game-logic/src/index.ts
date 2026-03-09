// 游戏初始化
export {
  createInitialBag,
  shuffleBag,
  drawTiles,
  fillFactories,
  createPlayerBoard,
  initializeGame,
  prepareNewRound,
} from './gameInit';

// 玩家行动
export {
  validatePlacement,
  getValidPlacements,
  placeTilesOnPatternLine,
  takeTilesFromFactory,
  takeTilesFromCenter,
  isPickingPhaseOver,
} from './gameActions';

// 计分逻辑
export {
  calculateTileScore,
  calculateFloorPenalty,
  tilePatternLinesToWall,
  scoreRound,
  checkGameEnd,
  calculateEndGameBonus,
  calculateFinalScores,
} from './gameScoring';
