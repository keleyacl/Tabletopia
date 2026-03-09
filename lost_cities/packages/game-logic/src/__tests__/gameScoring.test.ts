import { describe, it, expect } from 'vitest';
import { scoreExpedition, scoreAll, calcMatchWins, roundWinner, isGameOver } from '../gameScoring';
import { Card, Expeditions, GameState } from '@lost-cities/shared';
import { createGameState } from '../gameInit';

function makeCard(id: number, color: string, type: string, value: number): Card {
  return { id, color: color as any, type: type as any, value };
}

describe('scoreExpedition', () => {
  it('空探险列得0分', () => {
    expect(scoreExpedition([])).toBe(0);
  });

  it('只有一张点数牌时扣除20分成本', () => {
    const expedition = [makeCard(1, 'red', 'number', 5)];
    // (5 - 20) * 1 = -15
    expect(scoreExpedition(expedition)).toBe(-15);
  });

  it('多张点数牌正确计分', () => {
    const expedition = [
      makeCard(1, 'red', 'number', 5),
      makeCard(2, 'red', 'number', 7),
      makeCard(3, 'red', 'number', 10),
    ];
    // (5 + 7 + 10 - 20) * 1 = 2
    expect(scoreExpedition(expedition)).toBe(2);
  });

  it('投资牌正确乘以倍数', () => {
    const expedition = [
      makeCard(1, 'red', 'wager', 0),
      makeCard(2, 'red', 'number', 8),
      makeCard(3, 'red', 'number', 10),
    ];
    // (8 + 10 - 20) * 2 = -4
    expect(scoreExpedition(expedition)).toBe(-4);
  });

  it('3张投资牌乘以4倍', () => {
    const expedition = [
      makeCard(1, 'red', 'wager', 0),
      makeCard(2, 'red', 'wager', 0),
      makeCard(3, 'red', 'wager', 0),
      makeCard(4, 'red', 'number', 6),
      makeCard(5, 'red', 'number', 7),
      makeCard(6, 'red', 'number', 8),
      makeCard(7, 'red', 'number', 9),
      makeCard(8, 'red', 'number', 10),
    ];
    // (6+7+8+9+10 - 20) * 4 + 20 = 20 * 4 + 20 = 100
    expect(scoreExpedition(expedition)).toBe(100);
  });

  it('8张及以上额外+20分', () => {
    const expedition = [
      makeCard(1, 'red', 'wager', 0),
      makeCard(2, 'red', 'number', 2),
      makeCard(3, 'red', 'number', 3),
      makeCard(4, 'red', 'number', 4),
      makeCard(5, 'red', 'number', 5),
      makeCard(6, 'red', 'number', 6),
      makeCard(7, 'red', 'number', 7),
      makeCard(8, 'red', 'number', 8),
    ];
    // (2+3+4+5+6+7+8 - 20) * 2 + 20 = 15 * 2 + 20 = 50
    expect(scoreExpedition(expedition)).toBe(50);
  });
});

describe('scoreAll', () => {
  it('所有空探险列总分为0', () => {
    const expeditions: Expeditions = {
      red: [], green: [], blue: [], yellow: [], white: [],
    };
    const result = scoreAll(expeditions);
    expect(result.total).toBe(0);
  });
});

describe('calcMatchWins', () => {
  it('空历史返回[0,0]', () => {
    expect(calcMatchWins([])).toEqual([0, 0]);
  });

  it('正确计算胜局', () => {
    const history = [
      { roundIndex: 1, scores: [10, 5] as [number, number] },
      { roundIndex: 2, scores: [3, 8] as [number, number] },
      { roundIndex: 3, scores: [7, 7] as [number, number] },
    ];
    expect(calcMatchWins(history)).toEqual([1, 1]);
  });
});

describe('roundWinner', () => {
  it('玩家0分高时返回0', () => {
    expect(roundWinner(10, 5)).toBe(0);
  });

  it('玩家1分高时返回1', () => {
    expect(roundWinner(5, 10)).toBe(1);
  });

  it('平局时返回-1', () => {
    expect(roundWinner(5, 5)).toBe(-1);
  });
});

describe('isGameOver', () => {
  it('未结束时返回false', () => {
    const state = createGameState(3);
    expect(isGameOver(state)).toBe(false);
  });

  it('最后一局结束时返回true', () => {
    const state = createGameState(1);
    state.round.finished = true;
    expect(isGameOver(state)).toBe(true);
  });
});
