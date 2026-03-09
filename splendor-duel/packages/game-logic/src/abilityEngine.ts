// ============================================================
// 璀璨宝石·对决 - 特殊能力处理器 (AbilityEngine)
// ============================================================

import {
  Card,
  CardAbility,
  Coord,
  GameState,
  GemType,
  PendingAbility,
  ResolveAbilityAction,
} from '@splendor/shared';
import { BOARD_SIZE, NON_GOLD_GEM_TYPES } from '@splendor/shared';

// ============================================================
// 能力触发
// ============================================================

/**
 * 根据卡牌能力类型设置 pendingAbility 状态
 * TakePrivilege 和 ExtraTurn 可以立即解决，不需要玩家交互
 */
export function triggerAbility(
  state: GameState,
  pendingAbility: PendingAbility
): void {
  const { ability } = pendingAbility;

  switch (ability) {
    case CardAbility.TakePrivilege:
      // 立即解决：获得 1 个特权卷轴
      resolveTakePrivilege(state);
      break;

    case CardAbility.ExtraTurn:
      // 立即解决：标记额外回合
      state.hasExtraTurn = true;
      break;

    case CardAbility.TakeToken:
    case CardAbility.RobToken:
    case CardAbility.CopyColor:
      // 需要玩家交互，设置 pendingAbility 等待解决
      state.pendingAbility = pendingAbility;
      state.turnPhase = 'ResolveAbilities';
      break;
  }
}

// ============================================================
// 能力解决
// ============================================================

/**
 * 解决待处理的能力效果
 */
export function resolveAbility(
  state: GameState,
  action: ResolveAbilityAction
): { success: boolean; error?: string } {
  const pending = state.pendingAbility;
  if (!pending) {
    return { success: false, error: '没有待解决的能力' };
  }

  switch (pending.ability) {
    case CardAbility.TakeToken:
      return resolveTakeToken(state, pending, action);

    case CardAbility.RobToken:
      return resolveRobToken(state, action);

    case CardAbility.CopyColor:
      return resolveCopyColor(state, pending, action);

    default:
      return { success: false, error: `未知的能力类型: ${pending.ability}` };
  }
}

// ============================================================
// 各能力的具体解决逻辑
// ============================================================

/**
 * TakeToken: 从棋盘取 1 个与卡牌同色的宝石
 */
function resolveTakeToken(
  state: GameState,
  pending: PendingAbility,
  action: ResolveAbilityAction
): { success: boolean; error?: string } {
  if (!action.coord) {
    return { success: false, error: 'TakeToken 能力需要指定棋盘坐标' };
  }

  const { x, y } = action.coord;
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return { success: false, error: '坐标超出棋盘范围' };
  }

  const slot = state.board[y][x];
  if (slot.gem === null) {
    return { success: false, error: '该位置没有宝石' };
  }

  // 检查宝石颜色是否与卡牌 bonus 颜色一致
  if (pending.bonusColor && slot.gem !== pending.bonusColor) {
    return { success: false, error: `只能拿取 ${pending.bonusColor} 颜色的宝石` };
  }

  // 执行拿取
  const player = state.players[state.currentPlayerIndex];
  player.inventory[slot.gem] = (player.inventory[slot.gem] || 0) + 1;
  slot.gem = null;

  // 清除 pendingAbility
  state.pendingAbility = null;

  return { success: true };
}

/**
 * RobToken: 从对手处抢夺 1 个非黄金宝石
 */
function resolveRobToken(
  state: GameState,
  action: ResolveAbilityAction
): { success: boolean; error?: string } {
  if (!action.gemType) {
    return { success: false, error: 'RobToken 能力需要指定要抢夺的宝石类型' };
  }

  if (action.gemType === GemType.Gold) {
    return { success: false, error: '不能抢夺黄金' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];

  if ((opponent.inventory[action.gemType] || 0) <= 0) {
    return { success: false, error: `对手没有 ${action.gemType} 宝石` };
  }

  // 执行抢夺
  opponent.inventory[action.gemType] -= 1;
  currentPlayer.inventory[action.gemType] = (currentPlayer.inventory[action.gemType] || 0) + 1;

  // 清除 pendingAbility
  state.pendingAbility = null;

  return { success: true };
}

/**
 * CopyColor: 选择复制另一张已购卡牌的颜色作为额外 bonus
 */
function resolveCopyColor(
  state: GameState,
  pending: PendingAbility,
  action: ResolveAbilityAction
): { success: boolean; error?: string } {
  if (!action.copyColor) {
    return { success: false, error: 'CopyColor 能力需要指定要复制的颜色' };
  }

  // 验证选择的颜色是否在已购卡牌的 bonus 中存在
  const player = state.players[state.currentPlayerIndex];
  const hasColorInPurchased = player.purchasedCards.some(
    (c: Card) => c.bonus === action.copyColor && c.id !== pending.card.id
  );

  if (!hasColorInPurchased) {
    return { success: false, error: `你没有 ${action.copyColor} 颜色的已购卡牌可供复制` };
  }

  // 验证不能复制珍珠或黄金
  if (action.copyColor === GemType.Pearl || action.copyColor === GemType.Gold) {
    return { success: false, error: '不能复制珍珠或黄金颜色' };
  }

  // 执行复制：给当前卡牌的 Wild bonus 赋予实际颜色
  player.bonuses[action.copyColor] = (player.bonuses[action.copyColor] || 0) + 1;

  // 如果卡牌有分数，也更新 scoresByColor
  if (pending.card.points > 0) {
    player.scoresByColor[action.copyColor] =
      (player.scoresByColor[action.copyColor] || 0) + pending.card.points;
  }

  // 清除 pendingAbility
  state.pendingAbility = null;

  return { success: true };
}

/**
 * TakePrivilege: 获得 1 个特权卷轴（立即解决，无需玩家交互）
 */
function resolveTakePrivilege(state: GameState): void {
  const player = state.players[state.currentPlayerIndex];
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];

  if (state.privilegePool > 0) {
    // 从公共池获取
    state.privilegePool -= 1;
    player.privileges += 1;
  } else if (opponent.privileges > 0) {
    // 从对手处获取
    opponent.privileges -= 1;
    player.privileges += 1;
  }
  // 如果都没有，则不获得
}

/**
 * 获取 TakeToken 能力可选的棋盘坐标
 */
export function getAvailableTakeTokenCoords(
  state: GameState,
  bonusColor: GemType
): Coord[] {
  const coords: Coord[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (state.board[y][x].gem === bonusColor) {
        coords.push({ x, y });
      }
    }
  }
  return coords;
}

/**
 * 获取 RobToken 能力可选的宝石类型
 */
export function getAvailableRobTokenTypes(state: GameState): GemType[] {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];

  return NON_GOLD_GEM_TYPES.filter((gem: GemType) => (opponent.inventory[gem] || 0) > 0);
}

/**
 * 获取 CopyColor 能力可选的颜色
 */
export function getAvailableCopyColors(
  state: GameState,
  cardId: string
): GemType[] {
  const player = state.players[state.currentPlayerIndex];
  const colorSet = new Set<GemType>();

  for (const card of player.purchasedCards) {
    if (card.id !== cardId && card.bonus !== 'Wild') {
      const bonus = card.bonus as GemType;
      if (bonus !== GemType.Pearl && bonus !== GemType.Gold) {
        colorSet.add(bonus);
      }
    }
  }

  return Array.from(colorSet);
}
