// ============================================================
// 璀璨宝石·对决 - 5x5 棋盘组件
// 支持多选交互，选中宝石高亮发光
// ============================================================

import React from 'react';
import { GemType, Coord } from '@splendor/shared';
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

  const isCoordSelected = (x: number, y: number) =>
    selectedCoords.some((c) => c.x === x && c.y === y);

  const isCoordHighlighted = (x: number, y: number) =>
    highlightedSlots.some((c) => c.x === x && c.y === y);

  const canSelect = turnPhase === 'Main' && !gameState.hasPerformedMainAction;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 棋盘标题 */}
      <div className="text-sm text-purple-300 font-medium tracking-wider uppercase">
        宝石棋盘
      </div>

      {/* 5x5 网格 */}
      <div
        className="grid gap-2 p-4 rounded-2xl glass"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(0,0,0,0.2)',
        }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((_, x) => {
            const slot = board[y][x];
            const selected = isCoordSelected(x, y);
            const highlighted = isCoordHighlighted(x, y);

            return (
              <div
                key={`${x}-${y}`}
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${slot.gem === null
                    ? 'bg-gray-800/50 border border-gray-700/30'
                    : ''
                  }
                  ${highlighted ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent' : ''}
                `}
              >
                {slot.gem !== null ? (
                  <GemToken
                    gemType={slot.gem}
                    size="lg"
                    selected={selected}
                    disabled={
                      slot.gem === GemType.Gold ||
                      (!canSelect && !highlighted)
                    }
                    onClick={() => {
                      if (highlighted && pendingAbility) {
                        // 能力解决模式
                        return;
                      }
                      if (canSelect && slot.gem !== GemType.Gold) {
                        toggleCoord({ x, y });
                      }
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-900/40 border border-gray-700/20" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 选取操作按钮 */}
      {selectedCoords.length > 0 && (
        <div className="flex gap-3 animate-fade-in">
          <button
            onClick={confirmTakeTokens}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600
                       text-white font-medium text-sm
                       hover:from-purple-500 hover:to-indigo-500
                       transition-all duration-200 shadow-lg shadow-purple-500/25"
          >
            确认拿取 ({selectedCoords.length})
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 text-sm
                       hover:bg-gray-600/50 transition-all duration-200"
          >
            取消
          </button>
        </div>
      )}

      {/* 袋中剩余宝石数量 */}
      <div className="text-xs text-gray-500">
        袋中剩余: {gameState.bag.length} 颗宝石
      </div>
    </div>
  );
};

export default GemBoard;
