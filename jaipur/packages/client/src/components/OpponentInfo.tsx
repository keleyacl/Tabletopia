// ============================================================
// 斋浦尔 - 对手信息组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const OpponentInfo: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const currentPlayerIndex = useGameStore((state) => state.playerIndex);

  if (!gameState) return null;

  const { opponent } = gameState;
  const isOpponentTurn = gameState.currentPlayerIndex !== currentPlayerIndex;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">👤 对手</h2>
        {isOpponentTurn && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            行动中...
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">手牌数量:</span>
          <span className="font-bold">{opponent.handCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">骆驼数量:</span>
          <span className="font-bold">{opponent.camels}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">当前得分:</span>
          <span className="font-bold text-[var(--color-primary)]">{opponent.score}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">货物标记:</span>
          <span className="font-bold">{opponent.tokenCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">奖励标记:</span>
          <span className="font-bold">{opponent.bonusTokenCount}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {opponent.handCount === 0 && '对手没有手牌'}
          {opponent.handCount > 0 && `对手有 ${opponent.handCount} 张手牌`}
        </div>
      </div>
    </div>
  );
};

export default OpponentInfo;
