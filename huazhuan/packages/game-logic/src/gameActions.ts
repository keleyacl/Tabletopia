import {
  TileColor,
  GameState,
  PlayerBoard,
  BOARD_SIZE,
  FLOOR_LINE_SIZE,
  getWallColumnForColor,
} from '@azul/shared';

// ============================================================
// 合法性校验
// ============================================================

/**
 * 校验瓷砖放置是否合法
 * @param player 玩家板
 * @param color 要放置的瓷砖颜色
 * @param targetLineIndex 目标模式线行索引 (0-4)，-1 表示直接放入地板线
 * @returns 错误信息，null 表示合法
 */
export function validatePlacement(
  player: PlayerBoard,
  color: TileColor,
  targetLineIndex: number
): string | null {
  // 起始玩家标记不能放入模式线
  if (color === TileColor.FirstPlayer) {
    return '起始玩家标记不能放入模式线';
  }

  // 直接放入地板线总是合法的
  if (targetLineIndex === -1) {
    return null;
  }

  // 检查行索引范围
  if (targetLineIndex < 0 || targetLineIndex >= BOARD_SIZE) {
    return `无效的模式线行索引: ${targetLineIndex}`;
  }

  const line = player.patternLines[targetLineIndex];

  // 检查该行是否已满
  const filledCount = line.filter((t) => t !== null).length;
  if (filledCount >= line.length) {
    return `模式线第 ${targetLineIndex + 1} 行已满`;
  }

  // 检查该行已有的颜色是否与要放置的颜色一致
  const existingColor = line.find((t) => t !== null);
  if (existingColor !== undefined && existingColor !== color) {
    return `模式线第 ${targetLineIndex + 1} 行已有不同颜色的瓷砖`;
  }

  // 核心规则：检查墙面对应行中是否已存在该颜色
  const wallCol = getWallColumnForColor(targetLineIndex, color);
  if (wallCol !== -1 && player.wall[targetLineIndex][wallCol]) {
    return `墙面第 ${targetLineIndex + 1} 行已有该颜色的瓷砖`;
  }

  return null;
}

/**
 * 获取当前玩家所有合法的放置位置
 * @param player 玩家板
 * @param color 要放置的瓷砖颜色
 * @returns 合法的模式线行索引数组（包含 -1 表示地板线）
 */
export function getValidPlacements(
  player: PlayerBoard,
  color: TileColor
): number[] {
  const validLines: number[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (validatePlacement(player, color, i) === null) {
      validLines.push(i);
    }
  }

  // 地板线总是可以放的
  validLines.push(-1);

  return validLines;
}

// ============================================================
// 瓷砖放置
// ============================================================

/**
 * 将瓷砖放入模式线，溢出的进入地板线
 * @param player 玩家板（会被修改）
 * @param tiles 要放置的瓷砖数组
 * @param targetLineIndex 目标模式线行索引，-1 表示全部放入地板线
 * @param discardPile 弃置堆（地板线满了之后溢出的瓷砖进入弃置堆）
 * @returns 更新后的 [player, discardPile]
 */
export function placeTilesOnPatternLine(
  player: PlayerBoard,
  tiles: TileColor[],
  targetLineIndex: number,
  discardPile: TileColor[]
): { player: PlayerBoard; discardPile: TileColor[] } {
  const newPlayer: PlayerBoard = {
    ...player,
    patternLines: player.patternLines.map((line) => [...line]),
    floorLine: [...player.floorLine],
  };
  const newDiscardPile = [...discardPile];

  if (targetLineIndex === -1) {
    // 全部放入地板线
    for (const tile of tiles) {
      addToFloorLine(newPlayer, tile, newDiscardPile);
    }
    return { player: newPlayer, discardPile: newDiscardPile };
  }

  const line = newPlayer.patternLines[targetLineIndex];
  const capacity = line.length;
  const filledCount = line.filter((t) => t !== null).length;
  const availableSlots = capacity - filledCount;

  // 放入模式线（从右往左填充）
  let placed = 0;
  for (let i = line.length - 1; i >= 0 && placed < tiles.length; i--) {
    if (line[i] === null) {
      line[i] = tiles[placed];
      placed++;
      if (placed >= availableSlots) break;
    }
  }

  // 溢出的瓷砖进入地板线
  for (let i = placed; i < tiles.length; i++) {
    addToFloorLine(newPlayer, tiles[i], newDiscardPile);
  }

  newPlayer.patternLines[targetLineIndex] = line;
  return { player: newPlayer, discardPile: newDiscardPile };
}

/**
 * 将瓷砖添加到地板线
 * 如果地板线已满，瓷砖进入弃置堆
 */
function addToFloorLine(
  player: PlayerBoard,
  tile: TileColor,
  discardPile: TileColor[]
): void {
  const emptyIndex = player.floorLine.indexOf(null);
  if (emptyIndex !== -1) {
    player.floorLine[emptyIndex] = tile;
  } else {
    // 地板线已满，瓷砖进入弃置堆（起始标记除外，起始标记不进弃置堆）
    if (tile !== TileColor.FirstPlayer) {
      discardPile.push(tile);
    }
  }
}

// ============================================================
// 核心行动函数
// ============================================================

/**
 * 从工厂拿砖
 * @param state 当前游戏状态
 * @param playerId 玩家 ID
 * @param factoryIndex 工厂索引
 * @param color 选择的颜色
 * @param targetLineIndex 目标模式线行索引，-1 表示放入地板线
 * @returns 更新后的游戏状态，或错误信息
 */
export function takeTilesFromFactory(
  state: GameState,
  playerId: string,
  factoryIndex: number,
  color: TileColor,
  targetLineIndex: number
): GameState | { error: string } {
  // 基本校验
  if (state.phase !== 'PICKING') {
    return { error: '当前不是拿砖阶段' };
  }

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    return { error: '玩家不存在' };
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return { error: '不是你的回合' };
  }

  if (factoryIndex < 0 || factoryIndex >= state.factories.length) {
    return { error: '无效的工厂索引' };
  }

  const factory = state.factories[factoryIndex];
  if (factory.length === 0) {
    return { error: '该工厂已空' };
  }

  // 不能选择起始玩家标记颜色
  if (color === TileColor.FirstPlayer) {
    return { error: '不能选择起始玩家标记' };
  }

  // 检查工厂中是否有该颜色
  const selectedTiles = factory.filter((t) => t === color);
  if (selectedTiles.length === 0) {
    return { error: '该工厂中没有该颜色的瓷砖' };
  }

  // 放置合法性校验
  const player = state.players[playerIndex];
  const validationError = validatePlacement(player, color, targetLineIndex);
  if (validationError) {
    return { error: validationError };
  }

  // 执行操作
  const remainingTiles = factory.filter((t) => t !== color);

  // 剩余瓷砖移入中心
  const newCenterPot = [...state.centerPot, ...remainingTiles];

  // 清空该工厂
  const newFactories = state.factories.map((f, i) =>
    i === factoryIndex ? [] : [...f]
  );

  // 放置瓷砖
  const { player: updatedPlayer, discardPile: newDiscardPile } =
    placeTilesOnPatternLine(
      player,
      selectedTiles,
      targetLineIndex,
      state.discardPile
    );

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? updatedPlayer : p
  );

  // 检查是否所有工厂和中心都空了（回合结束）
  const allEmpty =
    newFactories.every((f) => f.length === 0) &&
    newCenterPot.filter((t) => t !== TileColor.FirstPlayer).length === 0 &&
    newCenterPot.length <= 1;

  // 切换到下一个玩家
  const nextPlayerIndex = allEmpty
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    players: newPlayers,
    factories: newFactories,
    centerPot: newCenterPot,
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    phase: allEmpty ? 'TILING' : 'PICKING',
  };
}

/**
 * 从中心区域拿砖
 * @param state 当前游戏状态
 * @param playerId 玩家 ID
 * @param color 选择的颜色
 * @param targetLineIndex 目标模式线行索引，-1 表示放入地板线
 * @returns 更新后的游戏状态，或错误信息
 */
export function takeTilesFromCenter(
  state: GameState,
  playerId: string,
  color: TileColor,
  targetLineIndex: number
): GameState | { error: string } {
  // 基本校验
  if (state.phase !== 'PICKING') {
    return { error: '当前不是拿砖阶段' };
  }

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    return { error: '玩家不存在' };
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return { error: '不是你的回合' };
  }

  // 不能选择起始玩家标记颜色
  if (color === TileColor.FirstPlayer) {
    return { error: '不能选择起始玩家标记' };
  }

  // 检查中心是否有该颜色
  const selectedTiles = state.centerPot.filter((t) => t === color);
  if (selectedTiles.length === 0) {
    return { error: '中心区域没有该颜色的瓷砖' };
  }

  // 放置合法性校验
  const player = state.players[playerIndex];
  const validationError = validatePlacement(player, color, targetLineIndex);
  if (validationError) {
    return { error: validationError };
  }

  // 执行操作
  let newCenterPot = state.centerPot.filter((t) => t !== color);
  let updatedPlayer = { ...player };
  let newDiscardPile = [...state.discardPile];
  let newCenterTaken = state.centerTaken;

  // 如果是本轮第一个从中心拿砖的玩家，获得起始玩家标记
  if (!state.centerTaken) {
    const hasFirstPlayer = state.centerPot.includes(TileColor.FirstPlayer);
    if (hasFirstPlayer) {
      // 移除中心的起始标记
      newCenterPot = newCenterPot.filter((t) => t !== TileColor.FirstPlayer);
      // 起始标记放入该玩家的地板线
      const floorResult = placeTilesOnPatternLine(
        updatedPlayer,
        [TileColor.FirstPlayer],
        -1, // 直接放入地板线
        newDiscardPile
      );
      updatedPlayer = floorResult.player;
      newDiscardPile = floorResult.discardPile;
      newCenterTaken = true;
    }
  }

  // 放置选中的瓷砖
  const placeResult = placeTilesOnPatternLine(
    updatedPlayer,
    selectedTiles,
    targetLineIndex,
    newDiscardPile
  );
  updatedPlayer = placeResult.player;
  newDiscardPile = placeResult.discardPile;

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? updatedPlayer : p
  );

  // 检查是否所有工厂和中心都空了（回合结束）
  const allFactoriesEmpty = state.factories.every((f) => f.length === 0);
  const centerOnlyHasFirstPlayer =
    newCenterPot.length === 0 ||
    (newCenterPot.length === 1 &&
      newCenterPot[0] === TileColor.FirstPlayer);
  const allEmpty = allFactoriesEmpty && newCenterPot.length === 0;

  // 切换到下一个玩家
  const nextPlayerIndex = allEmpty
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    players: newPlayers,
    centerPot: newCenterPot,
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    centerTaken: newCenterTaken,
    phase: allEmpty ? 'TILING' : 'PICKING',
  };
}

/**
 * 检查拿砖阶段是否结束
 * 当所有工厂和中心区域都空了时，拿砖阶段结束
 */
export function isPickingPhaseOver(state: GameState): boolean {
  const allFactoriesEmpty = state.factories.every((f) => f.length === 0);
  const centerEmpty = state.centerPot.length === 0;
  return allFactoriesEmpty && centerEmpty;
}
