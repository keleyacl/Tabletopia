// ============================================================
// 斋浦尔 - 骆驼圈组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import Card from './Card';

const CamelZone: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const selectedCamelCount = useGameStore((state) => state.selectedCamelCount);
  const setCamelCount = useGameStore((state) => state.setCamelCount);
  const currentPlayerIndex = useGameStore((state) => state.playerIndex);
  const isMyTurn = useGameStore((state) => 
    state.gameState?.currentPlayerIndex === currentPlayerIndex
  );

  if (!gameState) return null;

  const { camels } = gameState.myPlayer;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">🐪 骆驼圈</h2>
        <div className="text-sm text-gray-600">
          {camels} 只
        </div>
      </div>
      
      <div className="flex gap-2 justify-center flex-wrap">
        {camels === 0 ? (
          <div className="text-gray-400 text-center py-4">
            没有骆驼
          </div>
        ) : (
          Array.from({ length: Math.min(camels, 10) }).map((_, index) => (
            <Card
              key={`camel-${index}`}
              type="CAMEL"
              selected={index < selectedCamelCount}
              clickable={isMyTurn && index < camels}
              onClick={() => {
                if (index < camels) {
                  const newCount = index + 1 === selectedCamelCount ? 0 : index + 1;
                  setCamelCount(newCount);
                }
              }}
              size="sm"
            />
          ))
        )}
      </div>

      {isMyTurn && camels > 0 && (
        <div className="mt-3 text-center">
          <div className="text-sm text-gray-600 mb-2">
            已选择: {selectedCamelCount} 只骆驼
          </div>
          <button
            onClick={() => setCamelCount(0)}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
          >
            清除选择
          </button>
        </div>
      )}
    </div>
  );
};

export default CamelZone;
