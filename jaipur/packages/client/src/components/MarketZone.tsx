// ============================================================
// 斋浦尔 - 市场区域组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import Card from './Card';

const MarketZone: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const selectedMarketIndices = useGameStore((state) => state.selectedMarketIndices);
  const toggleMarketSelection = useGameStore((state) => state.toggleMarketSelection);
  const currentPlayerIndex = useGameStore((state) => state.playerIndex);
  const isMyTurn = useGameStore((state) => 
    state.gameState?.currentPlayerIndex === currentPlayerIndex
  );

  if (!gameState) return null;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">🏪 市场</h2>
        {!isMyTurn && (
          <span className="text-sm text-gray-500">等待对手行动...</span>
        )}
      </div>
      
      <div className="flex gap-3 justify-center flex-wrap">
        {gameState.market.map((cardType, index) => (
          <Card
            key={`market-${index}`}
            type={cardType}
            selected={selectedMarketIndices.includes(index)}
            clickable={isMyTurn}
            onClick={() => toggleMarketSelection(index)}
            size="lg"
          />
        ))}
      </div>

      <div className="mt-3 text-center text-sm text-gray-600">
        剩余牌堆: {gameState.deckCount} 张
      </div>
    </div>
  );
};

export default MarketZone;
