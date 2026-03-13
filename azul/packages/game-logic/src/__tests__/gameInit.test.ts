import { describe, it, expect } from 'vitest';
import {
  createInitialBag,
  shuffleBag,
  drawTiles,
  fillFactories,
  createPlayerBoard,
  initializeGame,
} from '../gameInit';
import { TileColor, STANDARD_COLORS, TILES_PER_COLOR, TILES_PER_FACTORY } from '@azul/shared';

describe('createInitialBag', () => {
  it('应该创建 100 块瓷砖', () => {
    const bag = createInitialBag();
    expect(bag.length).toBe(100);
  });

  it('每种颜色应该有 20 块', () => {
    const bag = createInitialBag();
    for (const color of STANDARD_COLORS) {
      const count = bag.filter((t) => t === color).length;
      expect(count).toBe(TILES_PER_COLOR);
    }
  });

  it('不应该包含起始玩家标记', () => {
    const bag = createInitialBag();
    expect(bag.includes(TileColor.FirstPlayer)).toBe(false);
  });
});

describe('shuffleBag', () => {
  it('洗牌后长度不变', () => {
    const bag = createInitialBag();
    const shuffled = shuffleBag(bag);
    expect(shuffled.length).toBe(bag.length);
  });

  it('洗牌后包含相同的瓷砖', () => {
    const bag = createInitialBag();
    const shuffled = shuffleBag(bag);
    for (const color of STANDARD_COLORS) {
      const originalCount = bag.filter((t) => t === color).length;
      const shuffledCount = shuffled.filter((t) => t === color).length;
      expect(shuffledCount).toBe(originalCount);
    }
  });

  it('不应该修改原数组', () => {
    const bag = createInitialBag();
    const original = [...bag];
    shuffleBag(bag);
    expect(bag).toEqual(original);
  });
});

describe('drawTiles', () => {
  it('应该从袋子中抽取指定数量的瓷砖', () => {
    const bag = createInitialBag();
    const { drawn, bag: remainingBag } = drawTiles(bag, [], 4);
    expect(drawn.length).toBe(4);
    expect(remainingBag.length).toBe(96);
  });

  it('袋子为空时应该从弃置堆回收', () => {
    const bag: TileColor[] = [];
    const discardPile = [TileColor.Blue, TileColor.Red, TileColor.Yellow];
    const { drawn, bag: remainingBag, discardPile: remainingDiscard } = drawTiles(
      bag,
      discardPile,
      2
    );
    expect(drawn.length).toBe(2);
    expect(remainingDiscard.length).toBe(0);
    expect(remainingBag.length).toBe(1);
  });

  it('袋子和弃置堆都空时应该停止抽取', () => {
    const { drawn } = drawTiles([], [], 4);
    expect(drawn.length).toBe(0);
  });

  it('袋子不够时应该从弃置堆补充后继续', () => {
    const bag = [TileColor.Blue, TileColor.Red];
    const discardPile = [TileColor.Yellow, TileColor.Green, TileColor.White];
    const { drawn } = drawTiles(bag, discardPile, 4);
    expect(drawn.length).toBe(4);
  });
});

describe('fillFactories', () => {
  it('应该创建正确数量的工厂', () => {
    const bag = shuffleBag(createInitialBag());
    const { factories } = fillFactories(5, bag, []);
    expect(factories.length).toBe(5);
  });

  it('每个工厂应该有 4 块瓷砖', () => {
    const bag = shuffleBag(createInitialBag());
    const { factories } = fillFactories(5, bag, []);
    for (const factory of factories) {
      expect(factory.length).toBe(TILES_PER_FACTORY);
    }
  });

  it('抽取后袋子数量应该减少', () => {
    const bag = shuffleBag(createInitialBag());
    const { bag: remainingBag } = fillFactories(5, bag, []);
    expect(remainingBag.length).toBe(100 - 5 * 4);
  });
});

describe('createPlayerBoard', () => {
  it('应该创建正确的初始玩家板', () => {
    const board = createPlayerBoard('p1', 'Alice');
    expect(board.id).toBe('p1');
    expect(board.name).toBe('Alice');
    expect(board.score).toBe(0);
    expect(board.patternLines.length).toBe(5);
    expect(board.wall.length).toBe(5);
    expect(board.floorLine.length).toBe(7);
  });

  it('模式线每行容量应该递增', () => {
    const board = createPlayerBoard('p1', 'Alice');
    for (let i = 0; i < 5; i++) {
      expect(board.patternLines[i].length).toBe(i + 1);
      expect(board.patternLines[i].every((t) => t === null)).toBe(true);
    }
  });

  it('墙面应该全部为 false', () => {
    const board = createPlayerBoard('p1', 'Alice');
    for (const row of board.wall) {
      expect(row.length).toBe(5);
      expect(row.every((cell) => cell === false)).toBe(true);
    }
  });
});

describe('initializeGame', () => {
  it('应该正确初始化 2 人游戏', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    expect(state.players.length).toBe(2);
    expect(state.factories.length).toBe(5); // 2*2+1
    expect(state.phase).toBe('PICKING');
    expect(state.round).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.centerPot).toContain(TileColor.FirstPlayer);
  });

  it('应该正确初始化 4 人游戏', () => {
    const state = initializeGame([
      { id: 'p1', name: 'A' },
      { id: 'p2', name: 'B' },
      { id: 'p3', name: 'C' },
      { id: 'p4', name: 'D' },
    ]);
    expect(state.players.length).toBe(4);
    expect(state.factories.length).toBe(9); // 2*4+1
  });

  it('所有瓷砖总数应该为 100', () => {
    const state = initializeGame([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    const factoryTiles = state.factories.reduce((sum, f) => sum + f.length, 0);
    const centerTiles = state.centerPot.filter(
      (t) => t !== TileColor.FirstPlayer
    ).length;
    const bagTiles = state.bag.length;
    const discardTiles = state.discardPile.length;
    expect(factoryTiles + centerTiles + bagTiles + discardTiles).toBe(100);
  });
});
