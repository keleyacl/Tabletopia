// ============================================================
// 斋浦尔 - 动作验证 Hook
// ============================================================

import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { TradeGoodType } from '@jaipur/shared';
import { PREMIUM_GOODS, MIN_PREMIUM_SELL_COUNT, MAX_HAND_SIZE } from '@jaipur/shared';

interface ActionAvailability {
  /** 是否可以取一张牌 */
  canTakeOne: boolean;
  /** 是否可以取所有骆驼 */
  canTakeCamels: boolean;
  /** 是否可以交换 */
  canExchange: boolean;
  /** 是否可以出售（至少有一种货物满足出售条件） */
  canSell: boolean;
  /** 各种可出售货物的详细信息 */
  sellableGoods: Array<{ type: TradeGoodType; count: number; canSell: boolean }>;
  /** 是否是自己的回合 */
  isMyTurn: boolean;
}

export const useActionValidator = (): ActionAvailability => {
  const gameState = useGameStore((state) => state.gameState);
  const currentPlayerIndex = useGameStore((state) => state.playerIndex);
  const selectedMarketIndices = useGameStore((state) => state.selectedMarketIndices);
  const selectedHandIndices = useGameStore((state) => state.selectedHandIndices);
  const selectedCamelCount = useGameStore((state) => state.selectedCamelCount);

  return useMemo(() => {
    if (!gameState) {
      return {
        canTakeOne: false,
        canTakeCamels: false,
        canExchange: false,
        canSell: false,
        sellableGoods: [],
        isMyTurn: false,
      };
    }

    const isMyTurn = gameState.currentPlayerIndex === currentPlayerIndex;
    const { hand, camels } = gameState.myPlayer;
    const market = gameState.market;

    // ---- 取一张牌 ----
    // 条件：选中恰好 1 张市场牌 && 该牌不是骆驼 && 手牌 < 7 && 是自己回合
    const selectedOneNonCamel =
      selectedMarketIndices.length === 1 &&
      market[selectedMarketIndices[0]] !== 'CAMEL';
    const canTakeOne =
      isMyTurn &&
      selectedOneNonCamel &&
      hand.length < MAX_HAND_SIZE &&
      selectedHandIndices.length === 0 &&
      selectedCamelCount === 0;

    // ---- 取所有骆驼 ----
    // 条件：市场有骆驼 && 没有选中任何牌 && 是自己回合
    const camelCountInMarket = market.filter((c) => c === 'CAMEL').length;
    const canTakeCamels =
      isMyTurn &&
      camelCountInMarket > 0 &&
      selectedMarketIndices.length === 0 &&
      selectedHandIndices.length === 0 &&
      selectedCamelCount === 0;

    // ---- 交换 ----
    // 条件：选中的市场牌数 = 选中的手牌数 + 骆驼数 && 总数 >= 2
    //       && 不能用骆驼换骆驼（选中的市场牌不能全是骆驼）
    //       && 交换后手牌不超过上限
    //       && 是自己回合
    const marketSelCount = selectedMarketIndices.length;
    const handSelCount = selectedHandIndices.length;
    const totalGive = handSelCount + selectedCamelCount;
    const totalTake = marketSelCount;
    // 交换后新增的非骆驼手牌数 = 从市场取的非骆驼牌数 - 从手牌给出的牌数
    const marketNonCamelCount = selectedMarketIndices.filter(
      (i) => market[i] !== 'CAMEL'
    ).length;
    const handAfterExchange = hand.length - handSelCount + marketNonCamelCount;
    const canExchange =
      isMyTurn &&
      totalTake >= 1 &&
      totalGive >= 1 &&
      totalTake === totalGive &&
      totalTake + totalGive >= 4 && // 至少交换 2 张（每边至少 2）=> 总数 >= 4? 不对，规则是至少交换 2 张，即每边至少 1 张但总数 >= 2
      handAfterExchange <= MAX_HAND_SIZE;

    // 修正：交换规则是至少交换 2 张牌（即市场选 n 张，给出 n 张，n >= 2）
    const canExchangeFinal =
      isMyTurn &&
      totalTake >= 2 &&
      totalTake === totalGive &&
      handAfterExchange <= MAX_HAND_SIZE;

    // ---- 出售 ----
    // 条件：选中的手牌全是同一类型（非骆驼）&& 高级货物 >= 2 && 是自己回合
    // 注意：出售不需要选中市场牌
    const sellableGoods = Array.from(
      new Set(hand.filter((c) => c !== 'CAMEL') as TradeGoodType[])
    ).map((type) => {
      const count = hand.filter((c) => c === type).length;
      const isPremium = (PREMIUM_GOODS as readonly string[]).includes(type);
      const canSellThis = count >= (isPremium ? MIN_PREMIUM_SELL_COUNT : 1);
      return { type, count, canSell: canSellThis };
    });

    const canSell = isMyTurn && sellableGoods.some((g) => g.canSell);

    return {
      canTakeOne,
      canTakeCamels,
      canExchange: canExchangeFinal,
      canSell,
      sellableGoods,
      isMyTurn,
    };
  }, [
    gameState,
    currentPlayerIndex,
    selectedMarketIndices,
    selectedHandIndices,
    selectedCamelCount,
  ]);
};
