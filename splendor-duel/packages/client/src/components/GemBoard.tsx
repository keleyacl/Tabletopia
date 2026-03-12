// ============================================================
// 璀璨宝石·对决 - 宝石棋盘组件
// ============================================================

import React from 'react';
import { GemType } from '@splendor/shared';
import { BOARD_SIZE } from '@splendor/shared';
import { useGameStore } from '../store/gameStore';
import GemToken from './GemToken';

const GemBoard: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const selectedCoords = useGameStore((s) => s.selectedCoords);
  const highlightedSlots = useGameStore((s) => s.highlightedSlots);
  const toggleCoord = useGameStore((s) => s.toggleCoord);
  const confirmTakeTokens = useGameStore((s) => s.confirmTakeTokens);
  const clearSelection = useGameStore((s) => s.clearSelection);

  const { board, turnPhase, pendingAbility } = gameState;

  const isCoordSelected = (x: number, y: number) => selectedCoords.some((coord) => coord.x === x && coord.y === y);
  const isCoordHighlighted = (x: number, y: number) =>
    highlightedSlots.some((coord) => coord.x === x && coord.y === y);

  const canSelect = turnPhase === 'Main' && !gameState.hasPerformedMainAction;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium text-white/50">中央棋盘</div>
          <h2 className="mt-1 text-2xl font-semibold text-white">宝石分布</h2>
          <p className="mt-2 text-sm leading-7 text-[#9e94b6]">
            从中央棋盘中拿取可形成直线的宝石。黄金不能直接拿取。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          袋中剩余 <span className="font-semibold text-white">{gameState.bag.length}</span> 颗宝石
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 sm:p-5">
        <div
          className="mx-auto grid w-fit gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => {
              const slot = board[y][x];
              const selected = isCoordSelected(x, y);
              const highlighted = isCoordHighlighted(x, y);

              return (
                <div
                  key={`${x}-${y}`}
                  className={`flex h-16 w-16 items-center justify-center rounded-[22px] border transition-all sm:h-[4.5rem] sm:w-[4.5rem] ${
                    slot.gem === null
                      ? 'border-white/6 bg-white/[0.03]'
                      : 'border-white/10 bg-white/[0.04]'
                  } ${highlighted ? 'border-amber-300/45 bg-amber-300/10' : ''} ${
                    selected ? 'border-cyan-300/45 bg-cyan-300/10' : ''
                  }`}
                >
                  {slot.gem !== null ? (
                    <GemToken
                      gemType={slot.gem}
                      size="lg"
                      selected={selected}
                      disabled={slot.gem === GemType.Gold || (!canSelect && !highlighted)}
                      onClick={() => {
                        if (highlighted && pendingAbility) return;
                        if (canSelect && slot.gem !== GemType.Gold) {
                          toggleCoord({ x, y });
                        }
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-white/6 bg-white/[0.03]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedCoords.length > 0 && (
        <div className="flex flex-col gap-3 rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-cyan-50">已选择 {selectedCoords.length} 颗宝石</div>
            <div className="mt-1 text-sm leading-6 text-cyan-50/75">确认后会执行拿取动作，你也可以继续调整选择。</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearSelection}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/[0.1]"
            >
              取消选择
            </button>
            <button
              onClick={confirmTakeTokens}
              className="rounded-xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
            >
              确认拿取
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GemBoard;
