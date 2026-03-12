// ============================================================
// 璀璨宝石·对决 - 卡牌展示区组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { canAfford } from '@splendor/game-logic';
import CardItem from './CardItem';

const levelMeta = {
  3: { label: 'III 级牌堆', tone: 'border-amber-300/20 bg-amber-300/10 text-amber-100' },
  2: { label: 'II 级牌堆', tone: 'border-slate-300/18 bg-slate-300/10 text-slate-100' },
  1: { label: 'I 级牌堆', tone: 'border-orange-300/18 bg-orange-300/10 text-orange-100' },
};

const CardDisplay: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const doPurchaseCard = useGameStore((s) => s.doPurchaseCard);
  const doReserveCard = useGameStore((s) => s.doReserveCard);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const canAct = gameState.turnPhase === 'Main' && !gameState.hasPerformedMainAction;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-medium text-white/50">发展卡市场</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">卡牌展示区</h2>
        <p className="mt-2 text-sm leading-7 text-[#9e94b6]">从三个等级的卡牌中选择购买或预留，建立折扣与得分优势。</p>
      </div>

      <div className="space-y-4">
        {[3, 2, 1].map((level) => (
          <section key={level} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${levelMeta[level as 1 | 2 | 3].tone}`}>
                  {levelMeta[level as 1 | 2 | 3].label}
                </div>
                <div className="text-sm leading-6 text-[#9e94b6]">剩余 {gameState.decks[level].length} 张</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {gameState.display[level].map((card) => {
                const affordable = canAfford(currentPlayer, card);

                return (
                  <CardItem
                    key={card.id}
                    card={card}
                    canPurchase={canAct && affordable}
                    onPurchase={canAct ? () => doPurchaseCard(card.id) : undefined}
                    onReserve={canAct ? () => doReserveCard(card.id) : undefined}
                    compact
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default CardDisplay;
