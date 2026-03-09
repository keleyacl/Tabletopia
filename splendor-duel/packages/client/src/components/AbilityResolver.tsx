// ============================================================
// 璀璨宝石·对决 - 能力解决交互组件
// ============================================================

import React from 'react';
import { CardAbility, GemType, Coord } from '@splendor/shared';
import { GEM_DISPLAY_NAMES, NON_GOLD_GEM_TYPES, BASIC_GEM_TYPES, BOARD_SIZE } from '@splendor/shared';
import {
  getAvailableTakeTokenCoords,
  getAvailableRobTokenTypes,
  getAvailableCopyColors,
} from '@splendor/game-logic';
import { useGameStore } from '../store/gameStore';
import GemToken from './GemToken';

const AbilityResolver: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const doResolveAbility = useGameStore((s) => s.doResolveAbility);

  const { pendingAbility } = gameState;
  if (!pendingAbility) return null;

  const { ability, card, bonusColor } = pendingAbility;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-2xl p-6 border border-amber-500/30
                      shadow-2xl shadow-amber-500/20 max-w-md w-full mx-4 animate-pop-in">
        <h3 className="text-lg font-bold text-amber-300 mb-2">解决卡牌能力</h3>

        {/* TakeToken */}
        {ability === CardAbility.TakeToken && bonusColor && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              从棋盘上拿取 1 个 <span className="text-white font-medium">{GEM_DISPLAY_NAMES[bonusColor]}</span> 宝石
            </p>
            <div className="flex flex-wrap gap-2">
              {getAvailableTakeTokenCoords(gameState, bonusColor).map((coord: Coord) => (
                <button
                  key={`${coord.x}-${coord.y}`}
                  onClick={() => doResolveAbility({ type: 'ResolveAbility', coord })}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg
                             bg-gray-800 hover:bg-gray-700 border border-gray-600/30
                             transition-all"
                >
                  <GemToken gemType={bonusColor} size="sm" />
                  <span className="text-xs text-gray-300">({coord.x},{coord.y})</span>
                </button>
              ))}
              {getAvailableTakeTokenCoords(gameState, bonusColor).length === 0 && (
                <p className="text-sm text-gray-500">棋盘上没有该颜色的宝石，跳过此能力</p>
              )}
            </div>
            {getAvailableTakeTokenCoords(gameState, bonusColor).length === 0 && (
              <button
                onClick={() => {
                  // 无可选宝石时，直接跳过
                  gameState.pendingAbility = null;
                  gameState.turnPhase = 'OptionalAfter';
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm
                           hover:bg-gray-600 transition-all"
              >
                跳过
              </button>
            )}
          </div>
        )}

        {/* RobToken */}
        {ability === CardAbility.RobToken && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              从对手处抢夺 1 个非黄金宝石
            </p>
            <div className="flex flex-wrap gap-2">
              {getAvailableRobTokenTypes(gameState).map((gem: GemType) => {
                const opponentIdx = gameState.currentPlayerIndex === 0 ? 1 : 0;
                const count = gameState.players[opponentIdx].inventory[gem];
                return (
                  <button
                    key={gem}
                    onClick={() => doResolveAbility({ type: 'ResolveAbility', gemType: gem })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                               bg-gray-800 hover:bg-gray-700 border border-gray-600/30
                               transition-all"
                  >
                    <GemToken gemType={gem} size="sm" />
                    <span className="text-xs text-gray-300">
                      {GEM_DISPLAY_NAMES[gem]} ({count})
                    </span>
                  </button>
                );
              })}
              {getAvailableRobTokenTypes(gameState).length === 0 && (
                <p className="text-sm text-gray-500">对手没有可抢夺的宝石</p>
              )}
            </div>
          </div>
        )}

        {/* CopyColor */}
        {ability === CardAbility.CopyColor && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              选择一种颜色作为此卡牌的永久折扣
            </p>
            <div className="flex flex-wrap gap-2">
              {getAvailableCopyColors(gameState, card.id).map((gem: GemType) => (
                <button
                  key={gem}
                  onClick={() => doResolveAbility({ type: 'ResolveAbility', copyColor: gem })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-gray-800 hover:bg-gray-700 border border-gray-600/30
                             transition-all"
                >
                  <GemToken gemType={gem} size="sm" />
                  <span className="text-xs text-gray-300">{GEM_DISPLAY_NAMES[gem]}</span>
                </button>
              ))}
              {getAvailableCopyColors(gameState, card.id).length === 0 && (
                <p className="text-sm text-gray-500">没有可复制的颜色</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbilityResolver;
