// ============================================================
// 璀璨宝石·对决 - 操作栏组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { TurnPhase } from '@splendor/shared';

const phaseLabels: Record<TurnPhase, string> = {
  OptionalBefore: '回合开始，可选使用特权',
  Main: '主动作阶段',
  OptionalAfter: '主动作结束后的可选阶段',
  ResolveAbilities: '正在解决卡牌能力',
  DiscardExcess: '需要丢弃多余宝石',
};

const messageTone = {
  error: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  info: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-50',
};

const ActionBar: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const message = useGameStore((s) => s.message);
  const messageType = useGameStore((s) => s.messageType);
  const doRefillBoard = useGameStore((s) => s.doRefillBoard);
  const doSkipOptionalPhase = useGameStore((s) => s.doSkipOptionalPhase);

  const { turnPhase, currentPlayerIndex, hasPerformedMainAction } = gameState;
  const canRefill = turnPhase === 'Main' && !hasPerformedMainAction;
  const canSkip = turnPhase === 'OptionalBefore' || turnPhase === 'OptionalAfter';

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#101525]/82 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-medium text-white/50">回合控制台</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-lg font-semibold text-white">玩家 {currentPlayerIndex + 1} 的回合</div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-white/75">
              {phaseLabels[turnPhase]}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {canRefill && (
            <button
              onClick={doRefillBoard}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
            >
              重置棋盘
            </button>
          )}

          {canSkip && (
            <button
              onClick={doSkipOptionalPhase}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/[0.09]"
            >
              {turnPhase === 'OptionalBefore' ? '跳过并进入主动作' : '结束回合'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-7 ${messageTone[messageType]}`}>
          {message}
        </div>
      )}
    </section>
  );
};

export default ActionBar;
