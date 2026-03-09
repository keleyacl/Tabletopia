import { describe, it, expect } from 'vitest';
import {
  validatePlacement,
  getValidPlacements,
  placeTilesOnPatternLine,
  takeTilesFromFactory,
  takeTilesFromCenter,
} from '../gameActions';
import { initializeGame, createPlayerBoard } from '../gameInit';
import { TileColor, PlayerBoard, GameState, getWallColumnForColor } from '@azul/shared';

describe('validatePlacement', () => {
  it('空行应该允许放置', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const error = validatePlacement(player, TileColor.Blue, 0);
    expect(error).toBeNull();
  });

  it('同色行应该允许放置', () => {
    const player = createPlayerBoard('p1', 'Alice');
    player.patternLines[2][2] = TileColor.Blue; // 第 3 行放一个蓝色
    const error = validatePlacement(player, TileColor.Blue, 2);
    expect(error).toBeNull();
  });

  it('不同色行应该拒绝放置', () => {
    const player = createPlayerBoard('p1', 'Alice');
    player.patternLines[2][2] = TileColor.Red;
    const error = validatePlacement(player, TileColor.Blue, 2);
    expect(error).not.toBeNull();
  });

  it('已满的行应该拒绝放置', () => {
    const player = createPlayerBoard('p1', 'Alice');
    player.patternLines[0][0] = TileColor.Blue; // 第 1 行只有 1 格，已满
    const error = validatePlacement(player, TileColor.Blue, 0);
    expect(error).not.toBeNull();
  });

  it('墙面已有该颜色时应该拒绝放置', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const col = getWallColumnForColor(0, TileColor.Blue);
    player.wall[0][col] = true;
    const error = validatePlacement(player, TileColor.Blue, 0);
    expect(error).not.toBeNull();
  });

  it('起始玩家标记不能放入模式线', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const error = validatePlacement(player, TileColor.FirstPlayer, 0);
    expect(error).not.toBeNull();
  });

  it('放入地板线（-1）总是合法的', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const error = validatePlacement(player, TileColor.Blue, -1);
    expect(error).toBeNull();
  });
});

describe('getValidPlacements', () => {
  it('空板应该返回所有行和地板线', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const valid = getValidPlacements(player, TileColor.Blue);
    expect(valid).toContain(0);
    expect(valid).toContain(1);
    expect(valid).toContain(2);
    expect(valid).toContain(3);
    expect(valid).toContain(4);
    expect(valid).toContain(-1); // 地板线
  });
});

describe('placeTilesOnPatternLine', () => {
  it('应该正确放置瓷砖到模式线', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const tiles = [TileColor.Blue, TileColor.Blue];
    const { player: updated } = placeTilesOnPatternLine(player, tiles, 2, []);
    // 第 3 行容量 3，放入 2 个
    const filledCount = updated.patternLines[2].filter((t) => t !== null).length;
    expect(filledCount).toBe(2);
  });

  it('溢出的瓷砖应该进入地板线', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const tiles = [TileColor.Blue, TileColor.Blue, TileColor.Blue];
    const { player: updated } = placeTilesOnPatternLine(player, tiles, 1, []);
    // 第 2 行容量 2，放入 3 个，1 个溢出到地板线
    const filledPattern = updated.patternLines[1].filter((t) => t !== null).length;
    expect(filledPattern).toBe(2);
    const filledFloor = updated.floorLine.filter((t) => t !== null).length;
    expect(filledFloor).toBe(1);
  });

  it('targetLineIndex 为 -1 时全部进入地板线', () => {
    const player = createPlayerBoard('p1', 'Alice');
    const tiles = [TileColor.Blue, TileColor.Blue];
    const { player: updated } = placeTilesOnPatternLine(player, tiles, -1, []);
    const filledFloor = updated.floorLine.filter((t) => t !== null).length;
    expect(filledFloor).toBe(2);
  });

  it('地板线满后溢出的瓷砖应该进入弃置堆', () => {
    const player = createPlayerBoard('p1', 'Alice');
    // 先填满地板线
    for (let i = 0; i < 7; i++) {
      player.floorLine[i] = TileColor.Red;
    }
    const tiles = [TileColor.Blue];
    const { discardPile } = placeTilesOnPatternLine(player, tiles, -1, []);
    expect(discardPile.length).toBe(1);
    expect(discardPile[0]).toBe(TileColor.Blue);
  });
});

describe('takeTilesFromFactory', () => {
  it('应该正确从工厂拿砖', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    // 找到第一个工厂中的一种颜色
    const factory = state.factories[0];
    const color = factory.find((t) => t !== TileColor.FirstPlayer)!;
    const colorCount = factory.filter((t) => t === color).length;

    const result = takeTilesFromFactory(state, 'p1', 0, color, 4);
    expect('error' in result).toBe(false);

    if (!('error' in result)) {
      // 工厂应该被清空
      expect(result.factories[0].length).toBe(0);
      // 剩余瓷砖应该移入中心
      const remainingCount = factory.length - colorCount;
      // 中心应该包含剩余瓷砖 + 原有的起始标记
      expect(result.centerPot.length).toBe(
        state.centerPot.length + remainingCount
      );
    }
  });

  it('不是自己的回合应该报错', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    const factory = state.factories[0];
    const color = factory.find((t) => t !== TileColor.FirstPlayer)!;

    const result = takeTilesFromFactory(state, 'p2', 0, color, 0);
    expect('error' in result).toBe(true);
  });

  it('空工厂应该报错', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    state.factories[0] = [];

    const result = takeTilesFromFactory(state, 'p1', 0, TileColor.Blue, 0);
    expect('error' in result).toBe(true);
  });
});

describe('takeTilesFromCenter', () => {
  it('第一个从中心拿砖的玩家应该获得起始标记', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    // 在中心放一些瓷砖
    state.centerPot.push(TileColor.Blue, TileColor.Blue);

    const result = takeTilesFromCenter(state, 'p1', TileColor.Blue, 4);
    expect('error' in result).toBe(false);

    if (!('error' in result)) {
      // 起始标记应该在玩家的地板线中
      const hasFirstPlayer = result.players[0].floorLine.includes(
        TileColor.FirstPlayer
      );
      expect(hasFirstPlayer).toBe(true);
      // 中心不应该再有起始标记
      expect(result.centerPot.includes(TileColor.FirstPlayer)).toBe(false);
      expect(result.centerTaken).toBe(true);
    }
  });

  it('中心没有该颜色时应该报错', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    // 中心只有起始标记
    const result = takeTilesFromCenter(state, 'p1', TileColor.Blue, 0);
    expect('error' in result).toBe(true);
  });
});
