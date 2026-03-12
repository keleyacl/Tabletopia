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

  const [discardAmounts, setDiscardAmounts] = useState<Record<GemType, number>>(() => {
    const amounts: Record<GemType, number> = {} as Record<GemType, number>;

    for (const gem of ALL_GEM_TYPES) {
      amounts[gem] = 0;
    }

    return amounts;
  });

  if (!showDiscardModal) return null;

  const player = gameState.players[gameState.currentPlayerIndex];
  const needToDiscard = getDiscardCount(gameState);
  const totalDiscarding = Object.values(discardAmounts).reduce((sum, value) => sum + value, 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05030d]/84 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-white/10 bg-[#151224]/95 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.46)]">
        <div className="text-xs font-medium text-white/50">丢弃阶段</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">丢弃多余宝石</h3>
        <p className="mt-3 text-sm leading-7 text-[#cdbfe2]">
          你的宝石数量超过上限 {MAX_TOKENS}。还需要丢弃{' '}
          <span className="font-semibold text-rose-200">{needToDiscard}</span> 个，当前已选择{' '}
          <span className="font-semibold text-white">{totalDiscarding}</span> 个。
        </p>

        <div className="mt-6 space-y-3">
          {ALL_GEM_TYPES.filter((gem) => player.inventory[gem] > 0).map((gem) => (
            <div key={gem} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <GemToken gemType={gem} size="md" />
                <div>
                  <div className="text-sm font-medium text-white">{GEM_DISPLAY_NAMES[gem]}</div>
                  <div className="text-xs text-white/45">当前持有 {player.inventory[gem]} 个</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDecrement(gem)}
                  disabled={discardAmounts[gem] <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/85 transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold text-white">{discardAmounts[gem]}</span>
                <button
                  type="button"
                  onClick={() => handleIncrement(gem)}
                  disabled={discardAmounts[gem] >= player.inventory[gem]}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/85 transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-7 text-rose-100">
            {message}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={totalDiscarding < needToDiscard}
          className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            totalDiscarding >= needToDiscard
              ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 text-white shadow-lg shadow-black/25 hover:brightness-110'
              : 'bg-white/[0.08] text-white/35'
          }`}
        >
          确认丢弃 ({totalDiscarding}/{needToDiscard})
        </button>
      </div>
    </div>
  );
};

export default DiscardModal;
