// ============================================================
// 璀璨宝石·对决 - 操作栏组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { TurnPhase } from '@splendor/shared';

const phaseLabels: Record<TurnPhase, string> = {
  OptionalBefore: '回合开始 - 可使用特权',
  Main: '主动作阶段',
  OptionalAfter: '主动作后 - 可使用特权',
  ResolveAbilities: '解决卡牌能力',
  DiscardExcess: '丢弃多余宝石',
};

const ActionBar: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const message = useGameStore((s) => s.message);
  const messageType = useGameStore((s) => s.messageType);
  const doRefillBoard = useGameStore((s) => s.doRefillBoard);
  const doSkipOptionalPhase = useGameStore((s) => s.doSkipOptionalPhase);

  const { turnPhase, currentPlayerIndex, hasPerformedMainAction } = gameState;
  const currentPlayer = gameState.players[currentPlayerIndex];

  const canRefill = turnPhase === 'Main' && !hasPerformedMainAction;
  const canSkip = turnPhase === 'OptionalBefore' || turnPhase === 'OptionalAfter';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 回合信息 */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          <span className="text-purple-400 font-medium">
            玩家 {currentPlayerIndex + 1}
          </span>
          {' '}的回合
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/20
                        text-xs text-purple-300">
          {phaseLabels[turnPhase]}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {canRefill && (
          <button
            onClick={doRefillBoard}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600
                       text-white text-sm font-medium
                       hover:from-amber-500 hover:to-orange-500
                       transition-all duration-200 shadow-lg shadow-amber-500/25"
          >
            重置棋盘
          </button>
        )}

        {canSkip && (
          <button
            onClick={doSkipOptionalPhase}
            className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 text-sm
                       hover:bg-gray-600/50 transition-all duration-200
                       border border-gray-600/30"
          >
            {turnPhase === 'OptionalBefore' ? '跳过，进入主动作' : '结束回合'}
          </button>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`
            px-4 py-2 rounded-lg text-sm animate-fade-in
            ${messageType === 'error' ? 'bg-red-900/40 text-red-300 border border-red-500/30' : ''}
            ${messageType === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30' : ''}
            ${messageType === 'info' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : ''}
          `}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default ActionBar;
