// ============================================================
// 璀璨宝石·对决 - 经济核算引擎 (EconomyEngine)
// ============================================================

import {
  Card,
  GemType,
  Player,
  GameState,
  PendingAbility,
} from '@splendor/shared';
import { ALL_GEM_TYPES, BASIC_GEM_TYPES, NON_GOLD_GEM_TYPES } from '@splendor/shared';

// ============================================================
// 费用计算
// ============================================================

/**
 * 计算玩家购买卡牌的实际费用（扣除 bonuses 后）
 * 返回每种颜色需要支付的宝石数量
 */
export function calculateNetCost(
  player: Player,
  card: Card
): Record<GemType, number> {
  const netCost: Record<GemType, number> = {} as Record<GemType, number>;

  for (const gem of ALL_GEM_TYPES) {
    netCost[gem] = 0;
  }

  for (const gem of NON_GOLD_GEM_TYPES) {
    const cardCost = card.cost[gem] || 0;
    const bonus = player.bonuses[gem] || 0;
    const required = Math.max(0, cardCost - bonus);
    netCost[gem] = required;
  }

  return netCost;
}

/**
 * 计算需要多少黄金来补齐差额
 */
export function calculateGoldNeeded(
  player: Player,
  card: Card
): number {
  const netCost = calculateNetCost(player, card);
  let goldNeeded = 0;

  for (const gem of NON_GOLD_GEM_TYPES) {
    const required = netCost[gem];
    const available = player.inventory[gem] || 0;
    if (required > available) {
      goldNeeded += required - available;
    }
  }

  return goldNeeded;
}

/**
 * 判断玩家是否能购买卡牌
 * 考虑 bonuses 折扣和 gold 替代
 */
export function canAfford(player: Player, card: Card): boolean {
  const goldNeeded = calculateGoldNeeded(player, card);
  const goldAvailable = player.inventory[GemType.Gold] || 0;
  return goldNeeded <= goldAvailable;
}

/**
 * 计算购买卡牌时实际需要支付的宝石明细
 * 返回每种颜色实际扣除的数量（包括黄金替代）
 */
export function calculatePayment(
  player: Player,
  card: Card
): { payment: Record<GemType, number>; goldUsed: number } {
  const netCost = calculateNetCost(player, card);
  const payment: Record<GemType, number> = {} as Record<GemType, number>;

  for (const gem of ALL_GEM_TYPES) {
    payment[gem] = 0;
  }

  let goldUsed = 0;

  for (const gem of NON_GOLD_GEM_TYPES) {
    const required = netCost[gem];
    const available = player.inventory[gem] || 0;
    const fromInventory = Math.min(required, available);
    payment[gem] = fromInventory;

    if (required > available) {
      goldUsed += required - available;
    }
  }

  payment[GemType.Gold] = goldUsed;

  return { payment, goldUsed };
}

// ============================================================
// 购买执行
// ============================================================

/**
 * 执行购买卡牌
 * 1. 扣除宝石（包括黄金替代）
 * 2. 将消耗的宝石放回袋子
 * 3. 更新玩家的 bonuses、score、crowns、scoresByColor
 * 4. 将卡牌加入已购买列表
 * 5. 如果卡牌有能力，设置 pendingAbility
 *
 * @returns 更新后的状态和可能的 pendingAbility
 */
export function executePurchase(
  state: GameState,
  playerIndex: 0 | 1,
  card: Card,
  fromReserved: boolean
): { pendingAbility: PendingAbility | null } {
  const player = state.players[playerIndex];

  // 计算支付
  const { payment } = calculatePayment(player, card);

  // 扣除宝石
  for (const gem of ALL_GEM_TYPES) {
    if (payment[gem] > 0) {
      player.inventory[gem] -= payment[gem];
    }
  }

  // 将消耗的非黄金宝石放回袋子
  for (const gem of NON_GOLD_GEM_TYPES) {
    for (let i = 0; i < payment[gem]; i++) {
      state.bag.push(gem);
    }
  }

  // 黄金放回公共堆（也放回袋子，因为黄金在棋盘上）
  // 注意：黄金不放回袋子，而是放回棋盘（通过 refill 机制）
  // 实际上黄金也放回袋子，因为袋子是所有宝石的来源
  for (let i = 0; i < payment[GemType.Gold]; i++) {
    state.bag.push(GemType.Gold);
  }

  // 更新玩家状态
  // 更新 bonus（永久折扣）
  if (card.bonus !== 'Wild') {
    player.bonuses[card.bonus] = (player.bonuses[card.bonus] || 0) + 1;
  }

  // 更新分数
  player.score += card.points;

  // 更新皇冠
  player.crowns += card.crowns;

  // 更新按颜色统计的分数
  if (card.bonus !== 'Wild' && card.points > 0) {
    player.scoresByColor[card.bonus] = (player.scoresByColor[card.bonus] || 0) + card.points;
  }

  // 将卡牌加入已购买列表
  player.purchasedCards.push(card);

  // 如果是从预留区购买，从预留列表中移除
  if (fromReserved) {
    const idx = player.reservedCards.findIndex((c: Card) => c.id === card.id);
    if (idx !== -1) {
      player.reservedCards.splice(idx, 1);
    }
  }

  // 处理能力触发
  let pendingAbility: PendingAbility | null = null;
  if (card.ability !== null) {
    pendingAbility = {
      ability: card.ability,
      card,
      bonusColor: card.bonus !== 'Wild' ? card.bonus : undefined,
    };
  }

  return { pendingAbility };
}

/**
 * 将宝石放回袋子
 */
export function returnTokensToBag(
  bag: GemType[],
  tokens: Partial<Record<GemType, number>>
): void {
  for (const [gem, count] of Object.entries(tokens)) {
    for (let i = 0; i < (count || 0); i++) {
      bag.push(gem as GemType);
    }
  }
}

/**
 * 计算玩家当前持有的宝石总数
 */
export function getTotalTokenCount(player: Player): number {
  let total = 0;
  for (const gem of ALL_GEM_TYPES) {
    total += player.inventory[gem] || 0;
  }
  return total;
}
