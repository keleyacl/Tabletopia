// ============================================================
// 璀璨宝石·对决 - 丢弃宝石弹窗组件
// ============================================================

import React, { useState } from 'react';
import { GemType } from '@splendor/shared';
import { ALL_GEM_TYPES, MAX_TOKENS, GEM_DISPLAY_NAMES } from '@splendor/shared';
import { getDiscardCount } from '@splendor/game-logic';
import { useGameStore } from '../store/gameStore';
import GemToken from './GemToken';

const DiscardModal: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const showDiscardModal = useGameStore((s) => s.showDiscardModal);
  const doDiscardTokens = useGameStore((s) => s.doDiscardTokens);
  const message = useGameStore((s) => s.message);

  const [discardAmounts, setDiscardAmounts] = useState<Record<GemType, number>>(
    () => {
      const amounts: Record<GemType, number> = {} as Record<GemType, number>;
      for (const gem of ALL_GEM_TYPES) {
        amounts[gem] = 0;
      }
      return amounts;
    }
  );

  if (!showDiscardModal) return null;

  const player = gameState.players[gameState.currentPlayerIndex];
  const needToDiscard = getDiscardCount(gameState);
  const totalDiscarding = Object.values(discardAmounts).reduce((a, b) => a + b, 0);

  const handleIncrement = (gem: GemType) => {
    if (discardAmounts[gem] < player.inventory[gem]) {
      setDiscardAmounts((prev) => ({ ...prev, [gem]: prev[gem] + 1 }));
    }
  };

  const handleDecrement = (gem: GemType) => {
    if (discardAmounts[gem] > 0) {
      setDiscardAmounts((prev) => ({ ...prev, [gem]: prev[gem] - 1 }));
    }
  };

  const handleConfirm = () => {
    const tokens: Partial<Record<GemType, number>> = {};
    for (const gem of ALL_GEM_TYPES) {
      if (discardAmounts[gem] > 0) {
        tokens[gem] = discardAmounts[gem];
      }
    }
    doDiscardTokens(tokens);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-2xl p-6 border border-purple-500/30
                      shadow-2xl shadow-purple-500/20 max-w-md w-full mx-4 animate-pop-in">
        <h3 className="text-lg font-bold text-white mb-2">丢弃多余宝石</h3>
        <p className="text-sm text-gray-400 mb-4">
          你的宝石超过了上限 ({MAX_TOKENS})，需要丢弃 <span className="text-red-400 font-bold">{needToDiscard}</span> 个宝石。
          已选择: <span className={totalDiscarding >= needToDiscard ? 'text-emerald-400' : 'text-yellow-400'}>{totalDiscarding}</span>
        </p>

        <div className="space-y-3 mb-6">
          {ALL_GEM_TYPES.filter((gem) => player.inventory[gem] > 0).map((gem) => (
            <div key={gem} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GemToken gemType={gem} size="sm" />
                <span className="text-sm text-gray-300">{GEM_DISPLAY_NAMES[gem]}</span>
                <span className="text-xs text-gray-500">({player.inventory[gem]})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecrement(gem)}
                  disabled={discardAmounts[gem] <= 0}
                  className="w-7 h-7 rounded bg-gray-700 text-gray-300 text-sm
                             hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-colors"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-medium text-white">
                  {discardAmounts[gem]}
                </span>
                <button
                  onClick={() => handleIncrement(gem)}
                  disabled={discardAmounts[gem] >= player.inventory[gem]}
                  className="w-7 h-7 rounded bg-gray-700 text-gray-300 text-sm
                             hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="mb-4 px-3 py-2 rounded bg-red-900/40 text-red-300 text-sm border border-red-500/30">
            {message}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={totalDiscarding < needToDiscard}
          className={`
            w-full py-2 rounded-lg font-medium text-sm transition-all
            ${totalDiscarding >= needToDiscard
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          确认丢弃 ({totalDiscarding}/{needToDiscard})
        </button>
      </div>
    </div>
  );
};

export default DiscardModal;
