import { describe, it, expect } from 'vitest';
import { checkVictory, getVictoryDetails } from '../victoryMonitor';
import { GemType, Player } from '@splendor/shared';
import { createEmptyPlayer } from '../gameInit';

describe('VictoryMonitor', () => {
  describe('checkVictory', () => {
    it('总分 >= 20 应返回 score', () => {
      const player = createEmptyPlayer(0);
      player.score = 20;
      expect(checkVictory(player)).toBe('score');
    });

    it('总分 > 20 应返回 score', () => {
      const player = createEmptyPlayer(0);
      player.score = 25;
      expect(checkVictory(player)).toBe('score');
    });

    it('皇冠数 >= 10 应返回 crowns', () => {
      const player = createEmptyPlayer(0);
      player.crowns = 10;
      expect(checkVictory(player)).toBe('crowns');
    });

    it('皇冠数 > 10 应返回 crowns', () => {
      const player = createEmptyPlayer(0);
      player.crowns = 12;
      expect(checkVictory(player)).toBe('crowns');
    });

    it('某颜色分数 >= 10 应返回 color', () => {
      const player = createEmptyPlayer(0);
      player.scoresByColor[GemType.Blue] = 10;
      expect(checkVictory(player)).toBe('color');
    });

    it('某颜色分数 > 10 应返回 color', () => {
      const player = createEmptyPlayer(0);
      player.scoresByColor[GemType.Red] = 12;
      expect(checkVictory(player)).toBe('color');
    });

    it('未满足任何条件应返回 null', () => {
      const player = createEmptyPlayer(0);
      player.score = 15;
      player.crowns = 5;
      player.scoresByColor[GemType.Blue] = 7;
      expect(checkVictory(player)).toBeNull();
    });

    it('分数为 19 不应获胜', () => {
      const player = createEmptyPlayer(0);
      player.score = 19;
      expect(checkVictory(player)).toBeNull();
    });

    it('皇冠为 9 不应获胜', () => {
      const player = createEmptyPlayer(0);
      player.crowns = 9;
      expect(checkVictory(player)).toBeNull();
    });

    it('单色分数为 9 不应获胜', () => {
      const player = createEmptyPlayer(0);
      player.scoresByColor[GemType.Green] = 9;
      expect(checkVictory(player)).toBeNull();
    });

    it('多个条件同时满足时应返回优先级最高的（score）', () => {
      const player = createEmptyPlayer(0);
      player.score = 20;
      player.crowns = 10;
      player.scoresByColor[GemType.Blue] = 10;
      expect(checkVictory(player)).toBe('score');
    });

    it('珍珠和黄金颜色的分数不应触发 color 胜利', () => {
      const player = createEmptyPlayer(0);
      player.scoresByColor[GemType.Pearl] = 15;
      player.scoresByColor[GemType.Gold] = 15;
      expect(checkVictory(player)).toBeNull();
    });
  });

  describe('getVictoryDetails', () => {
    it('获胜时应返回详细信息', () => {
      const player = createEmptyPlayer(0);
      player.score = 22;
      const details = getVictoryDetails(player);
      expect(details.type).toBe('score');
      expect(details.details).toContain('22');
    });

    it('未获胜时应返回游戏进行中', () => {
      const player = createEmptyPlayer(0);
      const details = getVictoryDetails(player);
      expect(details.type).toBeNull();
      expect(details.details).toContain('游戏进行中');
    });
  });
});
