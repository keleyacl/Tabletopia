// ============================================================
// 斋浦尔 - 操作按钮栏组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useActionValidator } from '../hooks/useActionValidator';
import { GOOD_NAMES, GOOD_ICONS } from '@jaipur/shared';

const ActionBar: React.FC = () => {
  const selectedMarketIndices = useGameStore((s) => s.selectedMarketIndices);
  const selectedHandIndices = useGameStore((s) => s.selectedHandIndices);
  const selectedCamelCount = useGameStore((s) => s.selectedCamelCount);

  const takeOne = useGameStore((s) => s.takeOne);
  const takeCamels = useGameStore((s) => s.takeCamels);
  const exchange = useGameStore((s) => s.exchange);
  const sellGoods = useGameStore((s) => s.sellGoods);
  const clearSelection = useGameStore((s) => s.clearSelection);

  const { canTakeOne, canTakeCamels, canExchange, canSell, sellableGoods, isMyTurn } =
    useActionValidator();

  const hasSelection =
    selectedMarketIndices.length > 0 ||
    selectedHandIndices.length > 0 ||
    selectedCamelCount > 0;

  const btnActive =
    'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white';
  const btnDisabled = 'bg-gray-200 text-gray-400 cursor-not-allowed';

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
      <h2 className="text-lg font-bold text-[var(--color-primary)] mb-3">🎮 行动</h2>

      {!isMyTurn && (
        <div className="text-center text-gray-500 py-4">等待对手行动...</div>
      )}

      {isMyTurn && (
        <div className="space-y-3">
          {/* 取一张牌 / 取所有骆驼 */}
          <div className="flex gap-2">
            <button
              onClick={takeOne}
              disabled={!canTakeOne}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                canTakeOne ? btnActive : btnDisabled
              }`}
            >
              取一张牌
            </button>
            <button
              onClick={takeCamels}
              disabled={!canTakeCamels}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                canTakeCamels ? btnActive : btnDisabled
              }`}
            >
              🐪 取所有骆驼
            </button>
          </div>

          {/* 交换 */}
          <button
            onClick={exchange}
            disabled={!canExchange}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              canExchange ? btnActive : btnDisabled
            }`}
          >
            交换（市场 {selectedMarketIndices.length} ↔ 手牌 {selectedHandIndices.length}
            {selectedCamelCount > 0 ? ` + 骆驼 ${selectedCamelCount}` : ''}）
          </button>

          {/* 出售货物 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-1">出售货物:</div>
            <div className="grid grid-cols-3 gap-2">
              {sellableGoods.map(({ type, count, canSell: canSellThis }) => (
                <button
                  key={type}
                  onClick={() => canSellThis && sellGoods(type, count)}
                  disabled={!canSellThis}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    canSellThis ? btnActive : btnDisabled
                  }`}
                >
                  {GOOD_ICONS[type]} {GOOD_NAMES[type]} ({count})
                </button>
              ))}
              {sellableGoods.length === 0 && (
                <div className="col-span-3 text-center text-gray-400 text-sm py-2">
                  手中没有可出售的货物
                </div>
              )}
            </div>
          </div>

          {/* 清除选择 */}
          {hasSelection && (
            <button
              onClick={clearSelection}
              className="w-full py-2 px-4 rounded-lg font-medium bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
            >
              清除选择
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionBar;
