// ============================================================
// 璀璨宝石·对决 - 三级卡牌展示区组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { canAfford } from '@splendor/game-logic';
import CardItem from './CardItem';

const CardDisplay: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const doPurchaseCard = useGameStore((s) => s.doPurchaseCard);
  const doReserveCard = useGameStore((s) => s.doReserveCard);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const canAct = gameState.turnPhase === 'Main' && !gameState.hasPerformedMainAction;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-purple-300 font-medium tracking-wider uppercase text-center">
        卡牌展示区
      </div>

      {[3, 2, 1].map((level) => (
        <div key={level} className="flex items-center gap-3">
          {/* 牌堆 */}
          <div
            className={`
              w-14 h-20 rounded-lg flex items-center justify-center
              ${level === 3 ? 'bg-gradient-to-b from-yellow-900/40 to-yellow-950/60 border border-yellow-700/30' : ''}
              ${level === 2 ? 'bg-gradient-to-b from-gray-600/40 to-gray-800/60 border border-gray-500/30' : ''}
              ${level === 1 ? 'bg-gradient-to-b from-amber-800/40 to-amber-950/60 border border-amber-700/30' : ''}
            `}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-gray-400">
                {level === 1 ? 'I' : level === 2 ? 'II' : 'III'}
              </div>
              <div className="text-xs text-gray-500">
                {gameState.decks[level].length}
              </div>
            </div>
          </div>

          {/* 展示区卡牌 */}
          <div className="flex gap-2 flex-wrap">
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
        </div>
      ))}
    </div>
  );
};

export default CardDisplay;
