// ============================================================
// 斋浦尔 - 手牌区域组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import Card from './Card';

const HandZone: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const selectedHandIndices = useGameStore((state) => state.selectedHandIndices);
  const toggleHandSelection = useGameStore((state) => state.toggleHandSelection);
  const currentPlayerIndex = useGameStore((state) => state.playerIndex);
  const isMyTurn = useGameStore((state) => 
    state.gameState?.currentPlayerIndex === currentPlayerIndex
  );

  if (!gameState) return null;

  const { hand } = gameState.myPlayer;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">🃏 我的手牌</h2>
        <div className="text-sm text-gray-600">
          {hand.length}/7
        </div>
      </div>
      
      <div className="flex gap-2 justify-center flex-wrap">
        {hand.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            手牌为空
          </div>
        ) : (
          hand.map((cardType, index) => (
            <Card
              key={`hand-${index}`}
              type={cardType}
              selected={selectedHandIndices.includes(index)}
              clickable={isMyTurn}
              onClick={() => toggleHandSelection(index)}
              size="md"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HandZone;
