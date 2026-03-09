// ============================================================
// 斋浦尔 (Jaipur) - 核心游戏动作
// ============================================================

import type {
  GameState,
  GameAction,
  ActionResult,
  TradeGoodType,
  GoodType,
} from '@jaipur/shared';
import {
  MAX_HAND_SIZE,
  MIN_EXCHANGE_COUNT,
  MIN_PREMIUM_SELL_COUNT,
  MARKET_SIZE,
  PREMIUM_GOODS,
} from '@jaipur/shared';
import { cloneState } from './utils';
import { checkGameEnd, calculateFinalScores } from './gameEnd';

// ============================================================
// 市场补牌
// ============================================================

/**
 * 从牌堆补齐市场至 5 张
 * 如果牌堆为空则不再补牌
 */
export function refillMarket(state: GameState): void {
  while (state.market.length < MARKET_SIZE && state.deck.length > 0) {
    state.market.push(state.deck.shift()!);
  }
}

// ============================================================
// 切换回合
// ============================================================

/**
 * 切换当前行动玩家
 */
export function switchTurn(state: GameState): void {
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
}

// ============================================================
// 操作一：取一张牌 (Take One)
// ============================================================

/**
 * 从市场中取一张非骆驼牌
 *
 * 校验：
 * - 索引合法（0-4）
 * - 目标牌不是骆驼
 * - 手牌未达上限（7 张）
 *
 * 操作：
 * - 将目标牌从市场移入手牌
 * - 从牌堆补一张牌到市场
 * - 切换回合
 */
export function takeOne(state: GameState, marketIndex: number): ActionResult {
  const newState = cloneState(state);
  const player = newState.players[newState.currentPlayerIndex];

  // 校验索引合法
  if (marketIndex < 0 || marketIndex >= newState.market.length) {
    return { success: false, error: '无效的市场索引' };
  }

  // 校验目标不是骆驼
  const targetCard = newState.market[marketIndex];
  if (targetCard === 'CAMEL') {
    return { success: false, error: '不能取骆驼牌，请使用"取所有骆驼"操作' };
  }

  // 校验手牌上限
  if (player.hand.length >= MAX_HAND_SIZE) {
    return { success: false, error: `手牌已达上限（${MAX_HAND_SIZE} 张）` };
  }

  // 执行操作
  player.hand.push(targetCard);
  newState.market.splice(marketIndex, 1);

  // 补齐市场
  refillMarket(newState);

  // 检查游戏结束
  if (checkGameEnd(newState)) {
    calculateFinalScores(newState);
    return { success: true, state: newState };
  }

  // 切换回合
  switchTurn(newState);

  return { success: true, state: newState };
}

// ============================================================
// 操作二：取所有骆驼 (Take All Camels)
// ============================================================

/**
 * 取走市场中所有骆驼牌
 *
 * 校验：
 * - 市场中至少有一张骆驼
 *
 * 操作：
 * - 将所有骆驼移入玩家骆驼圈
 * - 从牌堆补齐市场
 * - 切换回合
 */
export function takeCamels(state: GameState): ActionResult {
  const newState = cloneState(state);
  const player = newState.players[newState.currentPlayerIndex];

  // 统计市场中的骆驼数量
  const camelCount = newState.market.filter((card) => card === 'CAMEL').length;

  if (camelCount === 0) {
    return { success: false, error: '市场中没有骆驼' };
  }

  // 移除市场中的骆驼，加入玩家骆驼圈
  newState.market = newState.market.filter((card) => card !== 'CAMEL');
  player.camels += camelCount;

  // 补齐市场
  refillMarket(newState);

  // 检查游戏结束
  if (checkGameEnd(newState)) {
    calculateFinalScores(newState);
    return { success: true, state: newState };
  }

  // 切换回合
  switchTurn(newState);

  return { success: true, state: newState };
}

// ============================================================
// 操作三：交换 (Exchange)
// ============================================================

/**
 * 与市场交换牌
 *
 * 校验：
 * - 交换数量 >= 2
 * - 市场索引合法且不重复
 * - 手牌索引合法且不重复
 * - 手牌索引数量 + 骆驼数量 = 市场索引数量
 * - 玩家有足够的骆驼
 * - 交换后手牌不超过上限
 * - 不能用骆驼换骆驼（交换后市场不能和交换前完全相同）
 *
 * 操作：
 * - 从市场取出选中的牌
 * - 从手牌取出选中的牌放入市场
 * - 从骆驼圈取出指定数量的骆驼放入市场
 * - 将市场取出的牌加入手牌（骆驼进骆驼圈）
 * - 切换回合
 */
export function exchange(
  state: GameState,
  marketIndices: number[],
  handIndices: number[],
  camelCount: number,
): ActionResult {
  const newState = cloneState(state);
  const player = newState.players[newState.currentPlayerIndex];

  const totalGiveCount = handIndices.length + camelCount;

  // 校验交换数量
  if (marketIndices.length < MIN_EXCHANGE_COUNT) {
    return { success: false, error: `交换至少需要 ${MIN_EXCHANGE_COUNT} 张牌` };
  }

  // 校验数量匹配
  if (marketIndices.length !== totalGiveCount) {
    return { success: false, error: '给出的牌数量必须等于从市场取的牌数量' };
  }

  // 校验市场索引合法且不重复
  const uniqueMarketIndices = new Set(marketIndices);
  if (uniqueMarketIndices.size !== marketIndices.length) {
    return { success: false, error: '市场索引不能重复' };
  }
  for (const idx of marketIndices) {
    if (idx < 0 || idx >= newState.market.length) {
      return { success: false, error: '无效的市场索引' };
    }
  }

  // 校验手牌索引合法且不重复
  const uniqueHandIndices = new Set(handIndices);
  if (uniqueHandIndices.size !== handIndices.length) {
    return { success: false, error: '手牌索引不能重复' };
  }
  for (const idx of handIndices) {
    if (idx < 0 || idx >= player.hand.length) {
      return { success: false, error: '无效的手牌索引' };
    }
  }

  // 校验骆驼数量
  if (camelCount < 0) {
    return { success: false, error: '骆驼数量不能为负数' };
  }
  if (camelCount > player.camels) {
    return { success: false, error: '骆驼数量不足' };
  }

  // 获取要从市场取出的牌
  const marketCards = marketIndices.map((idx) => newState.market[idx]);

  // 获取要从手牌放出的牌
  const handCards = handIndices.map((idx) => player.hand[idx]);

  // 校验不能用骆驼换骆驼（取出的市场牌全是骆驼，且放入的全是骆驼）
  const allMarketCardsAreCamels = marketCards.every((card) => card === 'CAMEL');
  const allGiveCardsAreCamels = handCards.length === 0 && camelCount === totalGiveCount;
  if (allMarketCardsAreCamels && allGiveCardsAreCamels) {
    return { success: false, error: '不能用骆驼换骆驼' };
  }

  // 计算交换后的手牌数量
  // 从市场取出的非骆驼牌会进入手牌
  const nonCamelMarketCards = marketCards.filter((card) => card !== 'CAMEL');
  const newHandSize = player.hand.length - handIndices.length + nonCamelMarketCards.length;
  if (newHandSize > MAX_HAND_SIZE) {
    return { success: false, error: `交换后手牌将超过上限（${MAX_HAND_SIZE} 张）` };
  }

  // 执行交换操作

  // 1. 从市场移除选中的牌（从大索引开始移除，避免索引偏移）
  const sortedMarketIndices = [...marketIndices].sort((a, b) => b - a);
  for (const idx of sortedMarketIndices) {
    newState.market.splice(idx, 1);
  }

  // 2. 从手牌移除选中的牌（从大索引开始移除）
  const sortedHandIndices = [...handIndices].sort((a, b) => b - a);
  const removedHandCards: GoodType[] = [];
  for (const idx of sortedHandIndices) {
    removedHandCards.push(player.hand[idx]);
    player.hand.splice(idx, 1);
  }

  // 3. 将手牌中移除的牌放入市场
  for (const card of removedHandCards) {
    newState.market.push(card);
  }

  // 4. 将骆驼放入市场
  for (let i = 0; i < camelCount; i++) {
    newState.market.push('CAMEL');
    player.camels--;
  }

  // 5. 将从市场取出的牌加入玩家（骆驼进骆驼圈，其他进手牌）
  for (const card of marketCards) {
    if (card === 'CAMEL') {
      player.camels++;
    } else {
      player.hand.push(card);
    }
  }

  // 检查游戏结束
  if (checkGameEnd(newState)) {
    calculateFinalScores(newState);
    return { success: true, state: newState };
  }

  // 切换回合
  switchTurn(newState);

  return { success: true, state: newState };
}

// ============================================================
// 操作四：出售货物 (Sell Goods)
// ============================================================

/**
 * 出售手牌中的同类型货物
 *
 * 校验：
 * - 货物类型有效（非骆驼）
 * - 手牌中有足够数量的该类型货物
 * - 高级货物（钻石/黄金/白银）至少出售 2 张
 * - 出售数量 >= 1
 *
 * 操作：
 * - 从手牌移除指定数量的该类型货物
 * - 从对应标记堆顶取出等量标记（可能不足）
 * - 若出售 3 张及以上，额外获得奖励标记
 * - 累加分数
 * - 切换回合
 */
export function sellGoods(
  state: GameState,
  goodType: TradeGoodType,
  count: number,
): ActionResult {
  const newState = cloneState(state);
  const player = newState.players[newState.currentPlayerIndex];

  // 校验出售数量
  if (count < 1) {
    return { success: false, error: '出售数量至少为 1' };
  }

  // 校验高级货物最少出售数量
  const isPremium = (PREMIUM_GOODS as readonly string[]).includes(goodType);
  if (isPremium && count < MIN_PREMIUM_SELL_COUNT) {
    return { success: false, error: `高级货物（钻石/黄金/白银）至少出售 ${MIN_PREMIUM_SELL_COUNT} 张` };
  }

  // 统计手牌中该类型货物数量
  const goodCount = player.hand.filter((card) => card === goodType).length;
  if (goodCount < count) {
    return { success: false, error: `手牌中只有 ${goodCount} 张${goodType}，不足 ${count} 张` };
  }

  // 从手牌移除指定数量的该类型货物
  let removed = 0;
  player.hand = player.hand.filter((card) => {
    if (card === goodType && removed < count) {
      removed++;
      return false;
    }
    return true;
  });

  // 从标记堆顶取出标记
  const tokenStack = newState.tokens[goodType];
  let earnedScore = 0;
  const earnedTokens: number[] = [];

  for (let i = 0; i < count; i++) {
    if (tokenStack.length > 0) {
      const tokenValue = tokenStack.shift()!;
      earnedTokens.push(tokenValue);
      earnedScore += tokenValue;
    }
  }

  player.tokens.push(...earnedTokens);

  // 奖励标记
  if (count >= 5) {
    if (newState.bonusTokens.five.length > 0) {
      const bonus = newState.bonusTokens.five.shift()!;
      player.bonusTokens.push(bonus);
      earnedScore += bonus;
    }
  } else if (count === 4) {
    if (newState.bonusTokens.four.length > 0) {
      const bonus = newState.bonusTokens.four.shift()!;
      player.bonusTokens.push(bonus);
      earnedScore += bonus;
    }
  } else if (count === 3) {
    if (newState.bonusTokens.three.length > 0) {
      const bonus = newState.bonusTokens.three.shift()!;
      player.bonusTokens.push(bonus);
      earnedScore += bonus;
    }
  }

  // 累加分数
  player.score += earnedScore;

  // 检查游戏结束
  if (checkGameEnd(newState)) {
    calculateFinalScores(newState);
    return { success: true, state: newState };
  }

  // 切换回合
  switchTurn(newState);

  return { success: true, state: newState };
}

// ============================================================
// 统一动作分发
// ============================================================

/**
 * 根据动作类型分发到对应的处理函数
 */
export function applyAction(state: GameState, action: GameAction): ActionResult {
  switch (action.type) {
    case 'TAKE_ONE':
      return takeOne(state, action.marketIndex);
    case 'TAKE_CAMELS':
      return takeCamels(state);
    case 'EXCHANGE':
      return exchange(state, action.marketIndices, action.handIndices, action.camelCount);
    case 'SELL':
      return sellGoods(state, action.goodType, action.count);
    default:
      return { success: false, error: '未知的操作类型' };
  }
}
