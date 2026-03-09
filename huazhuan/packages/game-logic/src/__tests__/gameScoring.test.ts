import { describe, it, expect } from 'vitest';
import {
  calculateTileScore,
  calculateFloorPenalty,
  tilePatternLinesToWall,
  scoreRound,
  checkGameEnd,
  calculateEndGameBonus,
  calculateFinalScores,
} from '../gameScoring';
import { createPlayerBoard, initializeGame } from '../gameInit';
import { TileColor, BOARD_SIZE, getWallColumnForColor } from '@azul/shared';

describe('calculateTileScore', () => {
  it('孤立瓷砖应该得 1 分', () => {
    const wall = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    );
    wall[2][2] = true;
    expect(calculateTileScore(wall, 2, 2)).toBe(1);
  });

  it('水平连续 3 个应该得 3 分', () => {
    const wall = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    );
    wall[2][1] = true;
    wall[2][2] = true;
    wall[2][3] = true;
    expect(calculateTileScore(wall, 2, 2)).toBe(3);
  });

  it('垂直连续 3 个应该得 3 分', () => {
    const wall = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    );
    wall[1][2] = true;
    wall[2][2] = true;
    wall[3][2] = true;
    expect(calculateTileScore(wall, 2, 2)).toBe(3);
  });

  it('十字形应该得 H + V 分', () => {
    const wall = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    );
    // 水平：(2,1), (2,2), (2,3) = 3
    wall[2][1] = true;
    wall[2][2] = true;
    wall[2][3] = true;
    // 垂直：(1,2), (2,2), (3,2) = 3
    wall[1][2] = true;
    wall[3][2] = true;
    // 得分 = 3 + 3 = 6
    expect(calculateTileScore(wall, 2, 2)).toBe(6);
  });

  it('只有一个水平邻居应该得 2 分', () => {
    const wall = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    );
    wall[2][2] = true;
    wall[2][3] = true;
    expect(calculateTileScore(wall, 2, 2)).toBe(2);
  });
});

describe('calculateFloorPenalty', () => {
  it('空地板线应该扣 0 分', () => {
    const floorLine: (TileColor | null)[] = [null, null, null, null, null, null, null];
    expect(calculateFloorPenalty(floorLine)).toBe(0);
  });

  it('1 个瓷砖应该扣 1 分', () => {
    const floorLine: (TileColor | null)[] = [TileColor.Blue, null, null, null, null, null, null];
    expect(calculateFloorPenalty(floorLine)).toBe(-1);
  });

  it('2 个瓷砖应该扣 2 分', () => {
    const floorLine: (TileColor | null)[] = [
      TileColor.Blue, TileColor.Red, null, null, null, null, null,
    ];
    expect(calculateFloorPenalty(floorLine)).toBe(-2);
  });

  it('7 个瓷砖应该扣 14 分', () => {
    const floorLine: (TileColor | null)[] = [
      TileColor.Blue, TileColor.Red, TileColor.Yellow,
      TileColor.Black, TileColor.White, TileColor.Blue, TileColor.Red,
    ];
    // -1 -1 -2 -2 -2 -3 -3 = -14
    expect(calculateFloorPenalty(floorLine)).toBe(-14);
  });
});

describe('tilePatternLinesToWall', () => {
  it('填满的模式线应该移至墙面', () => {
    const player = createPlayerBoard('p1', 'Alice');
    // 填满第 1 行（容量 1）
    player.patternLines[0][0] = TileColor.Blue;

    const { player: updated, tilesPlaced } = tilePatternLinesToWall(player, []);
    expect(tilesPlaced.length).toBe(1);

    // 墙面对应位置应该为 true
    const col = getWallColumnForColor(0, TileColor.Blue);
    expect(updated.wall[0][col]).toBe(true);

    // 模式线应该被清空
    expect(updated.patternLines[0][0]).toBeNull();
  });

  it('未填满的模式线不应该移至墙面', () => {
    const player = createPlayerBoard('p1', 'Alice');
    // 第 3 行（容量 3）只放 2 个
    player.patternLines[2][1] = TileColor.Red;
    player.patternLines[2][2] = TileColor.Red;

    const { player: updated, tilesPlaced } = tilePatternLinesToWall(player, []);
    expect(tilesPlaced.length).toBe(0);
    // 模式线应该保持不变
    expect(updated.patternLines[2][1]).toBe(TileColor.Red);
  });

  it('多余的瓷砖应该进入弃置堆', () => {
    const player = createPlayerBoard('p1', 'Alice');
    // 填满第 3 行（容量 3）
    player.patternLines[2][0] = TileColor.Red;
    player.patternLines[2][1] = TileColor.Red;
    player.patternLines[2][2] = TileColor.Red;

    const { discardPile } = tilePatternLinesToWall(player, []);
    // 3 个中 1 个放到墙面，2 个进弃置堆
    expect(discardPile.length).toBe(2);
  });
});

describe('checkGameEnd', () => {
  it('没有完整行时游戏不应该结束', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    expect(checkGameEnd(state)).toBe(false);
  });

  it('有完整行时游戏应该结束', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    // 填满第一个玩家的第 0 行
    for (let c = 0; c < BOARD_SIZE; c++) {
      state.players[0].wall[0][c] = true;
    }
    expect(checkGameEnd(state)).toBe(true);
  });
});

describe('calculateEndGameBonus', () => {
  it('没有完成任何行/列/颜色时加分为 0', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const bonus = calculateEndGameBonus(player);
    expect(bonus.totalBonus).toBe(0);
  });

  it('完成一行应该加 2 分', () => {
    const player = createPlayerBoard('p1', 'Alice');
    for (let c = 0; c < BOARD_SIZE; c++) {
      player.wall[0][c] = true;
    }
    const bonus = calculateEndGameBonus(player);
    expect(bonus.completedRows).toBe(1);
    expect(bonus.rowBonus).toBe(2);
  });

  it('完成一列应该加 7 分', () => {
    const player = createPlayerBoard('p1', 'Alice');
    for (let r = 0; r < BOARD_SIZE; r++) {
      player.wall[r][0] = true;
    }
    const bonus = calculateEndGameBonus(player);
    expect(bonus.completedCols).toBe(1);
    expect(bonus.colBonus).toBe(7);
  });

  it('完成一种颜色应该加 10 分', () => {
    const player = createPlayerBoard('p1', 'Alice');
    // 在每行的蓝色位置放置瓷砖
    for (let r = 0; r < BOARD_SIZE; r++) {
      const col = getWallColumnForColor(r, TileColor.Blue);
      player.wall[r][col] = true;
    }
    const bonus = calculateEndGameBonus(player);
    expect(bonus.completedColors).toBe(1);
    expect(bonus.colorBonus).toBe(10);
  });
});

describe('scoreRound', () => {
  it('应该正确执行回合计分', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    // 填满玩家 1 的第 1 行
    state.players[0].patternLines[0][0] = TileColor.Blue;

    const { state: scored, scoreDetails } = scoreRound(state);
    expect(scoreDetails.length).toBe(2);

    // 玩家 1 应该得分
    const p1Detail = scoreDetails.find((d) => d.playerId === 'p1');
    expect(p1Detail).toBeDefined();
    expect(p1Detail!.tilesPlaced.length).toBe(1);
    expect(p1Detail!.tilesPlaced[0].score).toBe(1); // 孤立瓷砖得 1 分

    // 玩家 1 的分数应该更新
    expect(scored.players[0].score).toBe(1);
  });

  it('地板线扣分后分数不应低于 0', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    // 填满地板线
    for (let i = 0; i < 7; i++) {
      state.players[0].floorLine[i] = TileColor.Red;
    }

    const { state: scored } = scoreRound(state);
    expect(scored.players[0].score).toBeGreaterThanOrEqual(0);
  });
});
