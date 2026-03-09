// ============================================================
// 璀璨宝石·对决 - 胜利判定 (VictoryMonitor)
// ============================================================

import { GemType, Player, VictoryType } from '@splendor/shared';
import {
  VICTORY_SCORE,
  VICTORY_CROWNS,
  VICTORY_COLOR_SCORE,
  BASIC_GEM_TYPES,
} from '@splendor/shared';

/**
 * 检查玩家是否满足任一胜利条件
 * @returns 胜利类型，null 表示未获胜
 */
export function checkVictory(player: Player): VictoryType {
  // 条件1：总分 >= 20
  if (player.score >= VICTORY_SCORE) {
    return 'score';
  }

  // 条件2：皇冠数 >= 10
  if (player.crowns >= VICTORY_CROWNS) {
    return 'crowns';
  }

  // 条件3：某一颜色的卡牌分数之和 >= 10
  for (const gem of BASIC_GEM_TYPES) {
    if ((player.scoresByColor[gem] || 0) >= VICTORY_COLOR_SCORE) {
      return 'color';
    }
  }

  return null;
}

/**
 * 获取详细的胜利信息
 */
export function getVictoryDetails(player: Player): {
  type: VictoryType;
  details: string;
} {
  if (player.score >= VICTORY_SCORE) {
    return {
      type: 'score',
      details: `总分达到 ${player.score} 分（需要 ${VICTORY_SCORE} 分）`,
    };
  }

  if (player.crowns >= VICTORY_CROWNS) {
    return {
      type: 'crowns',
      details: `皇冠数达到 ${player.crowns} 个（需要 ${VICTORY_CROWNS} 个）`,
    };
  }

  for (const gem of BASIC_GEM_TYPES) {
    const colorScore = player.scoresByColor[gem] || 0;
    if (colorScore >= VICTORY_COLOR_SCORE) {
      return {
        type: 'color',
        details: `${gem} 颜色卡牌分数达到 ${colorScore} 分（需要 ${VICTORY_COLOR_SCORE} 分）`,
      };
    }
  }

  return { type: null, details: '游戏进行中' };
}
