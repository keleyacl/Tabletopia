// ============================================================
// 璀璨宝石·对决 - 玩家状态面板组件
// ============================================================

import React from 'react';
import { Player, GemType } from '@splendor/shared';
import { NON_GOLD_GEM_TYPES, ALL_GEM_TYPES, GEM_DISPLAY_NAMES } from '@splendor/shared';
import { canAfford } from '@splendor/game-logic';
import { useGameStore } from '../store/gameStore';
import GemToken from './GemToken';
import CardItem from './CardItem';

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
  isActive: boolean;
  position: 'top' | 'bottom';
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentPlayer,
  isActive,
  position,
}) => {
  const doPurchaseCard = useGameStore((s) => s.doPurchaseCard);
  const gameState = useGameStore((s) => s.gameState);
  const canAct = isActive && gameState.turnPhase === 'Main' && !gameState.hasPerformedMainAction;

  return (
    <div
      className={`
        rounded-2xl p-4 transition-all duration-300
        ${isActive
          ? 'glass ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10'
          : 'glass-dark opacity-80'
        }
      `}
    >
      <div className="flex items-start gap-6">
        {/* 玩家信息 */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
              ${player.id === 0
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                : 'bg-gradient-to-br from-rose-500 to-pink-600'
              }
              ${isActive ? 'animate-glow-pulse' : ''}
            `}
            style={{ ['--glow-color' as any]: player.id === 0 ? 'rgba(6,182,212,0.5)' : 'rgba(244,63,94,0.5)' }}
          >
            {player.id === 0 ? 'P1' : 'P2'}
          </div>
          <div className="text-sm font-medium">
            {player.id === 0 ? '玩家 1' : '玩家 2'}
          </div>
          {/* 分数 */}
          <div className="text-2xl font-bold text-white">
            {player.score}
            <span className="text-xs text-gray-400 ml-1">分</span>
          </div>
          {/* 皇冠 */}
          {player.crowns > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">👑</span>
              <span className="text-sm text-yellow-300 font-medium">{player.crowns}</span>
            </div>
          )}
        </div>

        {/* 宝石库存 */}
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 uppercase tracking-wider">宝石库存</div>
          <div className="flex gap-2 flex-wrap">
            {ALL_GEM_TYPES.map((gem) => (
              <div key={gem} className="flex flex-col items-center gap-0.5">
                <GemToken gemType={gem} size="sm" count={player.inventory[gem]} />
                {/* Bonus 标记 */}
                {gem !== GemType.Gold && gem !== GemType.Pearl && player.bonuses[gem] > 0 && (
                  <div className="text-[10px] text-emerald-400 font-bold">
                    +{player.bonuses[gem]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 特权卷轴 */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider">特权</div>
          <div className="flex gap-1">
            {Array.from({ length: player.privileges }).map((_, i) => (
              <div
                key={i}
                className="w-6 h-8 rounded bg-gradient-to-b from-amber-400 to-amber-600
                           border border-amber-300/50 shadow-md shadow-amber-500/20
                           flex items-center justify-center"
              >
                <span className="text-[10px] text-amber-900 font-bold">📜</span>
              </div>
            ))}
            {player.privileges === 0 && (
              <span className="text-xs text-gray-600">无</span>
            )}
          </div>
        </div>

        {/* 预留卡牌 */}
        {player.reservedCards.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-400 uppercase tracking-wider">预留</div>
            <div className="flex gap-1">
              {player.reservedCards.map((card) => {
                const affordable = isCurrentPlayer && canAfford(player, card);
                return (
                  <CardItem
                    key={card.id}
                    card={card}
                    canPurchase={canAct && affordable}
                    onPurchase={canAct && isCurrentPlayer ? () => doPurchaseCard(card.id) : undefined}
                    compact
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPanel;
