// ============================================================
// 璀璨宝石·对决 - 玩家动作处理 (GameActions)
// ============================================================

import {
  Card,
  Coord,
  GameState,
  GemType,
} from '@splendor/shared';
import {
  MAX_GOLD,
  MAX_RESERVED,
  MAX_TOKENS,
  NON_GOLD_GEM_TYPES,
  ALL_GEM_TYPES,
  BOARD_SIZE,
} from '@splendor/shared';
import {
  validateSelection,
  removeGemsFromBoard,
  refillBoard as refillBoardSlots,
  checkSameColorCount,
} from './boardLogic.js';
import {
  canAfford,
  executePurchase,
  getTotalTokenCount,
} from './economyEngine.js';
import { triggerAbility } from './abilityEngine.js';
import { refillDisplay } from './gameInit.js';
import { advancePhase } from './turnManager.js';

// ============================================================
// 拿取宝石
// ============================================================

/**
 * 从棋盘拿取宝石
 * 1. 校验选取合法性
 * 2. 检查 3 个同色宝石触发对手获得特权
 * 3. 更新玩家 inventory 和棋盘
 */
export function takeTokens(
  state: GameState,
  coords: Coord[]
): { success: boolean; error?: string } {
  // 检查是否在主动作阶段
  if (state.turnPhase !== 'Main' || state.hasPerformedMainAction) {
    return { success: false, error: '当前不能执行拿取宝石动作' };
  }

  // 校验选取
  const validation = validateSelection(state.board, coords);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 检查同色数量（用于触发特权）
  const sameColorInfo = checkSameColorCount(state.board, coords);

  // 从棋盘移除宝石
  const removedGems = removeGemsFromBoard(state.board, coords);

  // 添加到玩家库存
  const player = state.players[state.currentPlayerIndex];
  for (const gem of removedGems) {
    player.inventory[gem] = (player.inventory[gem] || 0) + 1;
  }

  // 如果拿了 3 个同色宝石，对手获得 1 个特权卷轴
  if (coords.length === 3 && sameColorInfo.maxSameColor === 3) {
    grantPrivilegeToOpponent(state);
  }

  // 标记已执行主动作
  state.hasPerformedMainAction = true;

  // 推进阶段
  advancePhase(state);

  return { success: true };
}

// ============================================================
// 预留卡牌
// ============================================================

/**
 * 预留卡牌
 * 1. 检查预留上限（3 张）
 * 2. 从 display 或 deck 顶部取卡
 * 3. 如果棋盘上有 Gold 且玩家 Gold < 3，获得 1 个 Gold
 */
export function reserveCard(
  state: GameState,
  cardId: string
): { success: boolean; error?: string } {
  // 检查是否在主动作阶段
  if (state.turnPhase !== 'Main' || state.hasPerformedMainAction) {
    return { success: false, error: '当前不能执行预留卡牌动作' };
  }

  const player = state.players[state.currentPlayerIndex];

  // 检查预留上限
  if (player.reservedCards.length >= MAX_RESERVED) {
    return { success: false, error: `预留卡牌已达上限 (${MAX_RESERVED} 张)` };
  }

  // 查找卡牌（先在展示区找，再在牌堆顶部找）
  let card: Card | null = null;
  let fromDisplay = false;
  let fromLevel = 0;

  // 在展示区查找
  for (const level of [1, 2, 3]) {
    const idx = state.display[level].findIndex((c: Card) => c.id === cardId);
    if (idx !== -1) {
      card = state.display[level].splice(idx, 1)[0];
      fromDisplay = true;
      fromLevel = level;
      break;
    }
  }

  // 如果不在展示区，检查是否是牌堆顶部预留（通过 level 标识）
  if (!card) {
    // cardId 格式为 "deck-{level}" 表示从牌堆顶部预留
    const deckMatch = cardId.match(/^deck-(\d)$/);
    if (deckMatch) {
      const level = parseInt(deckMatch[1]);
      if (state.decks[level] && state.decks[level].length > 0) {
        card = state.decks[level].pop()!;
        fromLevel = level;
      }
    }
  }

  if (!card) {
    return { success: false, error: '找不到指定的卡牌' };
  }

  // 将卡牌加入预留区
  player.reservedCards.push(card);

  // 尝试获得黄金
  if (player.inventory[GemType.Gold] < MAX_GOLD) {
    // 从棋盘上找黄金
    let goldFound = false;
    for (let y = 0; y < BOARD_SIZE && !goldFound; y++) {
      for (let x = 0; x < BOARD_SIZE && !goldFound; x++) {
        if (state.board[y][x].gem === GemType.Gold) {
          state.board[y][x].gem = null;
          player.inventory[GemType.Gold] += 1;
          goldFound = true;
        }
      }
    }
    // 如果棋盘上没有黄金，从袋子里找
    if (!goldFound) {
      const goldIdx = state.bag.indexOf(GemType.Gold);
      if (goldIdx !== -1) {
        state.bag.splice(goldIdx, 1);
        player.inventory[GemType.Gold] += 1;
      }
    }
  }

  // 补充展示区
  if (fromDisplay) {
    refillDisplay(state);
  }

  // 标记已执行主动作
  state.hasPerformedMainAction = true;

  // 推进阶段
  advancePhase(state);

  return { success: true };
}

// ============================================================
// 购买卡牌
// ============================================================

/**
 * 购买卡牌
 * 可以从展示区或预留区购买
 */
export function purchaseCard(
  state: GameState,
  cardId: string
): { success: boolean; error?: string } {
  // 检查是否在主动作阶段
  if (state.turnPhase !== 'Main' || state.hasPerformedMainAction) {
    return { success: false, error: '当前不能执行购买卡牌动作' };
  }

  const player = state.players[state.currentPlayerIndex];

  // 查找卡牌
  let card: Card | null = null;
  let fromReserved = false;
  let fromLevel = 0;

  // 先在预留区查找
  const reservedIdx = player.reservedCards.findIndex((c: Card) => c.id === cardId);
  if (reservedIdx !== -1) {
    card = player.reservedCards[reservedIdx];
    fromReserved = true;
  }

  // 再在展示区查找
  if (!card) {
    for (const level of [1, 2, 3]) {
      const idx = state.display[level].findIndex((c: Card) => c.id === cardId);
      if (idx !== -1) {
        card = state.display[level][idx];
        fromLevel = level;
        break;
      }
    }
  }

  if (!card) {
    return { success: false, error: '找不到指定的卡牌' };
  }

  // 检查是否买得起
  if (!canAfford(player, card)) {
    return { success: false, error: '资源不足，无法购买此卡牌' };
  }

  // 从展示区移除（如果是从展示区购买）
  if (!fromReserved) {
    for (const level of [1, 2, 3]) {
      const idx = state.display[level].findIndex((c: Card) => c.id === cardId);
      if (idx !== -1) {
        state.display[level].splice(idx, 1);
        break;
      }
    }
  }

  // 执行购买
  const { pendingAbility } = executePurchase(state, state.currentPlayerIndex, card, fromReserved);

  // 补充展示区
  if (!fromReserved) {
    refillDisplay(state);
  }

  // 标记已执行主动作
  state.hasPerformedMainAction = true;

  // 处理能力触发
  if (pendingAbility) {
    triggerAbility(state, pendingAbility);
  }

  // 如果没有待解决的能力，推进阶段
  if (state.pendingAbility === null) {
    advancePhase(state);
  }

  return { success: true };
}

// ============================================================
// 使用特权
// ============================================================

/**
 * 使用特权卷轴拿取 1 个非黄金宝石
 */
export function usePrivilege(
  state: GameState,
  coord: Coord
): { success: boolean; error?: string } {
  // 检查是否在可选阶段
  if (state.turnPhase !== 'OptionalBefore' && state.turnPhase !== 'OptionalAfter') {
    return { success: false, error: '当前阶段不能使用特权' };
  }

  const player = state.players[state.currentPlayerIndex];

  // 检查是否有特权卷轴
  if (player.privileges <= 0) {
    return { success: false, error: '没有特权卷轴可用' };
  }

  // 检查坐标
  if (coord.x < 0 || coord.x >= BOARD_SIZE || coord.y < 0 || coord.y >= BOARD_SIZE) {
    return { success: false, error: '坐标超出棋盘范围' };
  }

  const slot = state.board[coord.y][coord.x];
  if (slot.gem === null) {
    return { success: false, error: '该位置没有宝石' };
  }

  if (slot.gem === GemType.Gold) {
    return { success: false, error: '不能使用特权拿取黄金' };
  }

  // 执行拿取
  player.inventory[slot.gem] = (player.inventory[slot.gem] || 0) + 1;
  slot.gem = null;

  // 消耗特权卷轴
  player.privileges -= 1;
  state.privilegePool += 1;

  return { success: true };
}

// ============================================================
// 重置棋盘
// ============================================================

/**
 * 重置棋盘
 * 1. 将棋盘上所有宝石放回袋子
 * 2. 洗牌
 * 3. 重新填充棋盘
 * 4. 给对手 1 个特权卷轴
 */
export function doRefillBoard(
  state: GameState
): { success: boolean; error?: string } {
  // 检查是否在主动作阶段
  if (state.turnPhase !== 'Main' || state.hasPerformedMainAction) {
    return { success: false, error: '当前不能执行重置棋盘动作' };
  }

  // 将棋盘上所有宝石放回袋子
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const slot = state.board[y][x];
      if (slot.gem !== null) {
        state.bag.push(slot.gem);
        slot.gem = null;
      }
    }
  }

  // 洗牌
  for (let i = state.bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
  }

  // 重新填充棋盘
  refillBoardSlots(state.board, state.bag);

  // 给对手特权卷轴
  grantPrivilegeToOpponent(state);

  // 标记已执行主动作
  state.hasPerformedMainAction = true;

  // 推进阶段
  advancePhase(state);

  return { success: true };
}

// ============================================================
// 丢弃宝石
// ============================================================

/**
 * 丢弃多余宝石至上限
 */
export function discardTokens(
  state: GameState,
  tokens: Partial<Record<GemType, number>>
): { success: boolean; error?: string } {
  if (state.turnPhase !== 'DiscardExcess') {
    return { success: false, error: '当前不需要丢弃宝石' };
  }

  const player = state.players[state.currentPlayerIndex];

  // 计算丢弃总数
  let discardTotal = 0;
  for (const [gem, count] of Object.entries(tokens)) {
    if ((count || 0) < 0) {
      return { success: false, error: '丢弃数量不能为负数' };
    }
    if ((count || 0) > (player.inventory[gem as GemType] || 0)) {
      return { success: false, error: `${gem} 宝石数量不足` };
    }
    discardTotal += count || 0;
  }

  // 检查丢弃后是否满足上限
  const currentTotal = getTotalTokenCount(player);
  const afterTotal = currentTotal - discardTotal;
  if (afterTotal > MAX_TOKENS) {
    return { success: false, error: `丢弃后仍超过上限，还需丢弃 ${afterTotal - MAX_TOKENS} 个` };
  }

  // 执行丢弃
  for (const [gem, count] of Object.entries(tokens)) {
    const gemType = gem as GemType;
    const discardCount = count || 0;
    if (discardCount > 0) {
      player.inventory[gemType] -= discardCount;
      // 放回袋子
      for (let i = 0; i < discardCount; i++) {
        state.bag.push(gemType);
      }
    }
  }

  // 推进阶段（结束回合）
  advancePhase(state);

  return { success: true };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 给对手授予 1 个特权卷轴
 * 优先从公共池获取，如果公共池为空则从当前玩家处获取
 */
function grantPrivilegeToOpponent(state: GameState): void {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const currentPlayer = state.players[state.currentPlayerIndex];

  if (state.privilegePool > 0) {
    state.privilegePool -= 1;
    opponent.privileges += 1;
  } else if (currentPlayer.privileges > 0) {
    currentPlayer.privileges -= 1;
    opponent.privileges += 1;
  }
}
