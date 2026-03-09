import {
  TileColor,
  STANDARD_COLORS,
  GameState,
  PlayerBoard,
  Factory,
  TILES_PER_COLOR,
  TILES_PER_FACTORY,
  BOARD_SIZE,
  FLOOR_LINE_SIZE,
  getFactoryCount,
} from '@azul/shared';

/**
 * 创建初始瓷砖袋：每种颜色 20 块，共 100 块
 */
export function createInitialBag(): TileColor[] {
  const bag: TileColor[] = [];
  for (const color of STANDARD_COLORS) {
    for (let i = 0; i < TILES_PER_COLOR; i++) {
      bag.push(color);
    }
  }
  return bag;
}

/**
 * Fisher-Yates 洗牌算法
 * 原地打乱数组顺序
 */
export function shuffleBag(bag: TileColor[]): TileColor[] {
  const shuffled = [...bag];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 从袋子中抽取指定数量的瓷砖
 * 如果袋子不够，将弃置堆洗入袋子后继续抽取
 * @returns [抽取的瓷砖, 更新后的袋子, 更新后的弃置堆]
 */
export function drawTiles(
  bag: TileColor[],
  discardPile: TileColor[],
  count: number
): { drawn: TileColor[]; bag: TileColor[]; discardPile: TileColor[] } {
  let currentBag = [...bag];
  let currentDiscard = [...discardPile];
  const drawn: TileColor[] = [];

  for (let i = 0; i < count; i++) {
    if (currentBag.length === 0) {
      if (currentDiscard.length === 0) {
        // 袋子和弃置堆都空了，无法继续抽取
        break;
      }
      // 将弃置堆洗入袋子
      currentBag = shuffleBag(currentDiscard);
      currentDiscard = [];
    }
    drawn.push(currentBag.pop()!);
  }

  return { drawn, bag: currentBag, discardPile: currentDiscard };
}

/**
 * 填充所有工厂
 * 每个工厂放入 4 块瓷砖
 */
export function fillFactories(
  factoryCount: number,
  bag: TileColor[],
  discardPile: TileColor[]
): { factories: Factory[]; bag: TileColor[]; discardPile: TileColor[] } {
  const factories: Factory[] = [];
  let currentBag = [...bag];
  let currentDiscard = [...discardPile];

  for (let i = 0; i < factoryCount; i++) {
    const result = drawTiles(currentBag, currentDiscard, TILES_PER_FACTORY);
    factories.push(result.drawn);
    currentBag = result.bag;
    currentDiscard = result.discardPile;
  }

  return { factories, bag: currentBag, discardPile: currentDiscard };
}

/**
 * 创建一个空的玩家板
 */
export function createPlayerBoard(id: string, name: string): PlayerBoard {
  return {
    id,
    name,
    // 模式线：5 行，第 i 行容量为 i+1，初始全部为 null
    patternLines: Array.from({ length: BOARD_SIZE }, (_, i) =>
      Array.from({ length: i + 1 }, () => null)
    ),
    // 墙面：5x5 布尔矩阵，初始全部为 false
    wall: Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    ),
    // 地板线：最多 7 个位置，初始全部为 null
    floorLine: Array.from({ length: FLOOR_LINE_SIZE }, () => null),
    score: 0,
  };
}

/**
 * 初始化游戏
 * @param playerInfos 玩家信息数组 [{id, name}]
 * @returns 初始游戏状态
 */
export function initializeGame(
  playerInfos: { id: string; name: string }[]
): GameState {
  // 创建并洗牌
  const initialBag = shuffleBag(createInitialBag());

  // 创建玩家板
  const players = playerInfos.map((info) =>
    createPlayerBoard(info.id, info.name)
  );

  // 计算工厂数量并填充
  const factoryCount = getFactoryCount(playerInfos.length);
  const { factories, bag, discardPile } = fillFactories(
    factoryCount,
    initialBag,
    []
  );

  // 中心区域初始放入起始玩家标记
  const centerPot: TileColor[] = [TileColor.FirstPlayer];

  return {
    players,
    currentPlayerIndex: 0,
    factories,
    centerPot,
    bag,
    discardPile,
    phase: 'PICKING',
    round: 1,
    centerTaken: false,
  };
}

/**
 * 准备新一轮：重新填充工厂，重置中心区域
 */
export function prepareNewRound(state: GameState): GameState {
  const factoryCount = getFactoryCount(state.players.length);
  const { factories, bag, discardPile } = fillFactories(
    factoryCount,
    state.bag,
    state.discardPile
  );

  // 清空所有玩家的地板线，溢出的瓷砖进入弃置堆
  const newDiscardPile = [...discardPile];
  const newPlayers = state.players.map((player) => {
    const newFloorLine: (TileColor | null)[] = Array.from(
      { length: FLOOR_LINE_SIZE },
      () => null
    );
    // 地板线上的瓷砖（非起始标记）进入弃置堆
    for (const tile of player.floorLine) {
      if (tile !== null && tile !== TileColor.FirstPlayer) {
        newDiscardPile.push(tile);
      }
    }
    return {
      ...player,
      floorLine: newFloorLine,
    };
  });

  return {
    ...state,
    players: newPlayers,
    factories,
    centerPot: [TileColor.FirstPlayer],
    bag,
    discardPile: newDiscardPile,
    phase: 'PICKING' as const,
    round: state.round + 1,
    centerTaken: false,
  };
}
