import {
  TileColor,
  GameState,
  PlayerBoard,
  BOARD_SIZE,
  FLOOR_PENALTIES,
  BONUS_COMPLETE_ROW,
  BONUS_COMPLETE_COL,
  BONUS_COMPLETE_COLOR,
  STANDARD_COLORS,
  getWallColumnForColor,
  RoundScoreDetail,
  FinalScoreDetail,
} from '@azul/shared';

// ============================================================
// 连通计分算法
// ============================================================

/**
 * 计算在墙面 (row, col) 位置放置瓷砖后的得分
 *
 * 规则：
 * - 如果该位置水平和垂直方向都没有相邻瓷砖，得 1 分
 * - 如果水平方向有 H 个连续瓷砖（包含自身），得 H 分
 * - 如果垂直方向有 V 个连续瓷砖（包含自身），得 V 分
 * - 如果横纵都有相邻瓷砖，得 H + V 分（该瓷砖被计算两次）
 */
export function calculateTileScore(
  wall: boolean[][],
  row: number,
  col: number
): number {
  let horizontalCount = 1;
  let verticalCount = 1;

  // 向左计数
  for (let c = col - 1; c >= 0; c--) {
    if (wall[row][c]) {
      horizontalCount++;
    } else {
      break;
    }
  }

  // 向右计数
  for (let c = col + 1; c < BOARD_SIZE; c++) {
    if (wall[row][c]) {
      horizontalCount++;
    } else {
      break;
    }
  }

  // 向上计数
  for (let r = row - 1; r >= 0; r--) {
    if (wall[r][col]) {
      verticalCount++;
    } else {
      break;
    }
  }

  // 向下计数
  for (let r = row + 1; r < BOARD_SIZE; r++) {
    if (wall[r][col]) {
      verticalCount++;
    } else {
      break;
    }
  }

  // 计算得分
  if (horizontalCount === 1 && verticalCount === 1) {
    // 没有相邻瓷砖，得 1 分
    return 1;
  }

  let score = 0;
  if (horizontalCount > 1) {
    score += horizontalCount;
  }
  if (verticalCount > 1) {
    score += verticalCount;
  }

  // 如果只有一个方向有相邻，另一个方向计数为 1，则只算有相邻的方向
  // 但如果两个方向都有相邻，则两个方向都算（瓷砖被计算两次）
  if (horizontalCount > 1 && verticalCount === 1) {
    return horizontalCount;
  }
  if (verticalCount > 1 && horizontalCount === 1) {
    return verticalCount;
  }

  return score;
}

// ============================================================
// 地板线扣分
// ============================================================

/**
 * 计算地板线扣分
 * @param floorLine 地板线
 * @returns 扣分值（负数）
 */
export function calculateFloorPenalty(
  floorLine: (TileColor | null)[]
): number {
  let penalty = 0;
  for (let i = 0; i < floorLine.length; i++) {
    if (floorLine[i] !== null) {
      penalty += FLOOR_PENALTIES[i];
    }
  }
  return penalty;
}

// ============================================================
// 模式线移至墙面
// ============================================================

/**
 * 将填满的模式线移至墙面
 * @param player 玩家板
 * @param discardPile 弃置堆
 * @returns 更新后的 player、discardPile 和计分明细
 */
export function tilePatternLinesToWall(
  player: PlayerBoard,
  discardPile: TileColor[]
): {
  player: PlayerBoard;
  discardPile: TileColor[];
  tilesPlaced: { row: number; col: number; score: number }[];
} {
  const newPlayer: PlayerBoard = {
    ...player,
    patternLines: player.patternLines.map((line) => [...line]),
    wall: player.wall.map((row) => [...row]),
    floorLine: [...player.floorLine],
    score: player.score,
  };
  const newDiscardPile = [...discardPile];
  const tilesPlaced: { row: number; col: number; score: number }[] = [];

  for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++) {
    const line = newPlayer.patternLines[rowIndex];
    const capacity = rowIndex + 1;
    const filledCount = line.filter((t) => t !== null).length;

    // 只有填满的行才移至墙面
    if (filledCount < capacity) {
      continue;
    }

    // 获取该行的颜色
    const color = line.find((t) => t !== null)!;

    // 找到墙面对应位置
    const wallCol = getWallColumnForColor(rowIndex, color);
    if (wallCol === -1) continue;

    // 放置到墙面
    newPlayer.wall[rowIndex][wallCol] = true;

    // 计算该瓷砖的得分
    const tileScore = calculateTileScore(newPlayer.wall, rowIndex, wallCol);
    newPlayer.score += tileScore;
    tilesPlaced.push({ row: rowIndex, col: wallCol, score: tileScore });

    // 清空该模式线，多余的瓷砖进入弃置堆
    // 只有 1 块放到墙面，其余 capacity - 1 块进入弃置堆
    for (let i = 0; i < capacity - 1; i++) {
      if (color !== TileColor.FirstPlayer) {
        newDiscardPile.push(color);
      }
    }
    newPlayer.patternLines[rowIndex] = Array.from(
      { length: capacity },
      () => null
    );
  }

  return { player: newPlayer, discardPile: newDiscardPile, tilesPlaced };
}

// ============================================================
// 回合计分主函数
// ============================================================

/**
 * 执行回合结束计分
 * 1. 将填满的模式线移至墙面并计分
 * 2. 计算地板线扣分
 * 3. 清空地板线（瓷砖进入弃置堆）
 * 4. 分数不低于 0
 */
export function scoreRound(state: GameState): {
  state: GameState;
  scoreDetails: RoundScoreDetail[];
} {
  const newPlayers: PlayerBoard[] = [];
  let newDiscardPile = [...state.discardPile];
  const scoreDetails: RoundScoreDetail[] = [];

  for (const player of state.players) {
    // 1. 模式线移至墙面
    const wallResult = tilePatternLinesToWall(player, newDiscardPile);
    let updatedPlayer = wallResult.player;
    newDiscardPile = wallResult.discardPile;

    // 2. 地板线扣分
    const floorPenalty = calculateFloorPenalty(updatedPlayer.floorLine);
    updatedPlayer.score += floorPenalty;

    // 3. 分数不低于 0
    if (updatedPlayer.score < 0) {
      updatedPlayer.score = 0;
    }

    // 4. 清空地板线，瓷砖进入弃置堆
    for (const tile of updatedPlayer.floorLine) {
      if (tile !== null && tile !== TileColor.FirstPlayer) {
        newDiscardPile.push(tile);
      }
    }
    updatedPlayer = {
      ...updatedPlayer,
      floorLine: Array.from({ length: updatedPlayer.floorLine.length }, () => null),
    };

    newPlayers.push(updatedPlayer);

    scoreDetails.push({
      playerId: player.id,
      tilesPlaced: wallResult.tilesPlaced,
      floorPenalty,
      totalRoundScore:
        wallResult.tilesPlaced.reduce((sum, t) => sum + t.score, 0) +
        floorPenalty,
    });
  }

  return {
    state: {
      ...state,
      players: newPlayers,
      discardPile: newDiscardPile,
    },
    scoreDetails,
  };
}

// ============================================================
// 终局判定与额外加分
// ============================================================

/**
 * 检查游戏是否结束
 * 终局条件：任何一名玩家完成墙面的一整行（5 格全部填满）
 */
export function checkGameEnd(state: GameState): boolean {
  return state.players.some((player) =>
    player.wall.some((row) => row.every((cell) => cell))
  );
}

/**
 * 计算终局额外加分
 * - 完成一整行：+2 分
 * - 完成一整列：+7 分
 * - 收集齐某种颜色的全部 5 块瓷砖：+10 分
 */
export function calculateEndGameBonus(player: PlayerBoard): {
  completedRows: number;
  rowBonus: number;
  completedCols: number;
  colBonus: number;
  completedColors: number;
  colorBonus: number;
  totalBonus: number;
} {
  // 完整行
  let completedRows = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (player.wall[r].every((cell) => cell)) {
      completedRows++;
    }
  }

  // 完整列
  let completedCols = 0;
  for (let c = 0; c < BOARD_SIZE; c++) {
    let colComplete = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (!player.wall[r][c]) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      completedCols++;
    }
  }

  // 完整颜色（某种颜色的 5 块全部放到墙面上）
  let completedColors = 0;
  for (const color of STANDARD_COLORS) {
    let colorComplete = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const col = getWallColumnForColor(r, color);
      if (col === -1 || !player.wall[r][col]) {
        colorComplete = false;
        break;
      }
    }
    if (colorComplete) {
      completedColors++;
    }
  }

  const rowBonus = completedRows * BONUS_COMPLETE_ROW;
  const colBonus = completedCols * BONUS_COMPLETE_COL;
  const colorBonus = completedColors * BONUS_COMPLETE_COLOR;

  return {
    completedRows,
    rowBonus,
    completedCols,
    colBonus,
    completedColors,
    colorBonus,
    totalBonus: rowBonus + colBonus + colorBonus,
  };
}

/**
 * 执行终局计分，返回最终得分明细
 */
export function calculateFinalScores(
  state: GameState
): { state: GameState; finalScores: FinalScoreDetail[] } {
  const finalScores: FinalScoreDetail[] = [];
  const newPlayers = state.players.map((player) => {
    const bonus = calculateEndGameBonus(player);
    const finalScore = player.score + bonus.totalBonus;

    finalScores.push({
      playerId: player.id,
      playerName: player.name,
      baseScore: player.score,
      completedRows: bonus.completedRows,
      rowBonus: bonus.rowBonus,
      completedCols: bonus.completedCols,
      colBonus: bonus.colBonus,
      completedColors: bonus.completedColors,
      colorBonus: bonus.colorBonus,
      finalScore,
    });

    return {
      ...player,
      score: finalScore,
    };
  });

  return {
    state: {
      ...state,
      players: newPlayers,
      phase: 'END' as const,
    },
    finalScores,
  };
}
