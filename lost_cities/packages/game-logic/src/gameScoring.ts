// ============================================================
// 失落的城市 - 计分逻辑
// ============================================================

import {
  Card,
  Color,
  ColorScores,
  Expeditions,
  GameState,
  RoundHistory,
} from '@lost-cities/shared';
import {
  COLORS,
  EXPEDITION_COST,
  EXPEDITION_BONUS_THRESHOLD,
  EXPEDITION_BONUS_SCORE,
} from '@lost-cities/shared';

/**
 * 计算单色探险列得分
 */
export function scoreExpedition(expedition: Card[]): number {
  if (!expedition || expedition.length === 0) return 0;
  const wagers = expedition.filter((c) => c.type === 'wager').length;
  const numbers = expedition.filter((c) => c.type === 'number');
  const sum = numbers.reduce((acc, c) => acc + c.value, 0);
  let score = sum - EXPEDITION_COST;
  const multiplier = wagers === 0 ? 1 : 1 + wagers;
  score *= multiplier;
  if (expedition.length >= EXPEDITION_BONUS_THRESHOLD) score += EXPEDITION_BONUS_SCORE;
  return score;
}

/**
 * 计算所有颜色的探险列得分
 */
export function scoreAll(expeditions: Expeditions): ColorScores {
  const scores: Partial<Record<Color, number>> = {};
  let total = 0;
  for (const color of COLORS) {
    const score = scoreExpedition(expeditions[color]);
    scores[color] = score;
    total += score;
  }
  return { scores: scores as Record<Color, number>, total };
}

/**
 * 计算比赛胜局数
 */
export function calcMatchWins(history: RoundHistory[] | undefined): [number, number] {
  const wins: [number, number] = [0, 0];
  for (const round of history || []) {
    const score0 = round?.scores?.[0] ?? 0;
    const score1 = round?.scores?.[1] ?? 0;
    if (score0 > score1) wins[0] += 1;
    if (score1 > score0) wins[1] += 1;
  }
  return wins;
}

/**
 * 判断单局胜者
 * @returns 0 或 1 表示胜者，-1 表示平局
 */
export function roundWinner(score0: number, score1: number): number {
  if (score0 > score1) return 0;
  if (score1 > score0) return 1;
  return -1;
}

/**
 * 判断游戏是否结束
 */
export function isGameOver(state: GameState): boolean {
  return state.roundIndex === state.roundsTotal && state.round.finished;
}
