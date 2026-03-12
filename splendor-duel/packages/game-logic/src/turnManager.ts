// ============================================================
// 璀璨宝石·对决 - 回合管理器 (TurnManager)
// ============================================================
// 状态机驱动的回合控制
// 阶段流转：
//   OptionalBefore -> Main -> OptionalAfter/ResolveAbilities
//   ResolveAbilities -> OptionalAfter
//   OptionalAfter -> DiscardExcess/EndTurn
//   DiscardExcess -> EndTurn
// ============================================================

import { GameState, TurnPhase } from '@splendor/shared';
import { MAX_TOKENS } from '@splendor/shared';
import { getTotalTokenCount } from './economyEngine.js';
import { checkVictory } from './victoryMonitor.js';

// ============================================================
// 阶段推进
// ============================================================

/**
 * 推进回合阶段
 * 根据当前阶段和游戏状态决定下一个阶段
 */
export function advancePhase(state: GameState): void {
  switch (state.turnPhase) {
    case 'OptionalBefore':
      // 可选阶段结束，进入主动作阶段
      state.turnPhase = 'Main';
      break;

    case 'Main':
      // 主动作完成后，检查是否有待解决的能力
      if (state.pendingAbility !== null) {
        state.turnPhase = 'ResolveAbilities';
      } else {
        state.turnPhase = 'OptionalAfter';
      }
      break;

    case 'ResolveAbilities':
      // 能力解决后，进入可选后阶段
      state.turnPhase = 'OptionalAfter';
      break;

    case 'OptionalAfter':
      // 检查库存上限
      checkAndTransitionToDiscard(state);
      break;

    case 'DiscardExcess':
      // 丢弃完成后结束回合
      endTurn(state);
      break;
  }
}

/**
 * 跳过当前可选阶段，直接进入下一个必要阶段
 */
export function skipOptionalPhase(state: GameState): void {
  if (state.turnPhase === 'OptionalBefore') {
    state.turnPhase = 'Main';
  } else if (state.turnPhase === 'OptionalAfter') {
    checkAndTransitionToDiscard(state);
  }
}

/**
 * 检查是否需要丢弃多余宝石，否则直接结束回合
 */
function checkAndTransitionToDiscard(state: GameState): void {
  const player = state.players[state.currentPlayerIndex];
  const totalTokens = getTotalTokenCount(player);

  if (totalTokens > MAX_TOKENS) {
    state.turnPhase = 'DiscardExcess';
  } else {
    endTurn(state);
  }
}

// ============================================================
// 回合结束
// ============================================================

/**
 * 结束当前回合
 * 1. 检查胜利条件
 * 2. 切换玩家（除非有额外回合）
 * 3. 重置回合状态
 */
export function endTurn(state: GameState): void {
  // 检查当前玩家是否获胜
  const currentPlayer = state.players[state.currentPlayerIndex];
  const victory = checkVictory(currentPlayer);
  if (victory !== null) {
    state.winner = state.currentPlayerIndex;
    return;
  }

  // 切换玩家（除非有额外回合）
  if (state.hasExtraTurn) {
    state.hasExtraTurn = false;
    // 不切换玩家，但重置回合状态
  } else {
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  }

  // 重置回合状态
  state.turnPhase = 'OptionalBefore';
  state.hasPerformedMainAction = false;
  state.pendingAbility = null;
}

// ============================================================
// 阶段查询
// ============================================================

/**
 * 判断当前阶段是否可使用特权
 * 特权可在 OptionalBefore 和 OptionalAfter 阶段使用
 */
export function canUsePrivilege(state: GameState): boolean {
  if (state.turnPhase !== 'OptionalBefore' && state.turnPhase !== 'OptionalAfter') {
    return false;
  }

  const player = state.players[state.currentPlayerIndex];
  return player.privileges > 0;
}

/**
 * 判断当前阶段是否可执行主动作
 */
export function canPerformMainAction(state: GameState): boolean {
  return state.turnPhase === 'Main' && !state.hasPerformedMainAction;
}

/**
 * 判断当前阶段是否需要解决能力
 */
export function needsAbilityResolution(state: GameState): boolean {
  return state.turnPhase === 'ResolveAbilities' && state.pendingAbility !== null;
}

/**
 * 判断当前阶段是否需要丢弃宝石
 */
export function needsDiscard(state: GameState): boolean {
  if (state.turnPhase !== 'DiscardExcess') return false;
  const player = state.players[state.currentPlayerIndex];
  return getTotalTokenCount(player) > MAX_TOKENS;
}

/**
 * 获取需要丢弃的宝石数量
 */
export function getDiscardCount(state: GameState): number {
  const player = state.players[state.currentPlayerIndex];
  const total = getTotalTokenCount(player);
  return Math.max(0, total - MAX_TOKENS);
}
