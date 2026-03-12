// ============================================================
// 璀璨宝石·对决 - 玩家状态面板组件
// ============================================================

import React from 'react';
import { Player, GemType } from '@splendor/shared';
import { ALL_GEM_TYPES, NON_GOLD_GEM_TYPES, GEM_DISPLAY_NAMES } from '@splendor/shared';
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

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, isCurrentPlayer, isActive, position }) => {
  const doPurchaseCard = useGameStore((s) => s.doPurchaseCard);
  const gameState = useGameStore((s) => s.gameState);

  const canAct = isActive && gameState.turnPhase === 'Main' && !gameState.hasPerformedMainAction;
  const ownedBonuses = NON_GOLD_GEM_TYPES.filter((gem) => player.bonuses[gem] > 0);

  return (
    <section
      className={`rounded-[28px] border p-5 sm:p-6 transition-all ${
        isActive
          ? 'border-cyan-300/28 bg-[#151a2d]/88 shadow-[0_18px_60px_rgba(34,211,238,0.10)]'
          : 'border-white/10 bg-[#0f1324]/82'
      }`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex items-center gap-4 xl:min-w-[250px]">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg ${
              player.id === 0
                ? 'bg-gradient-to-br from-cyan-500 to-sky-600'
                : 'bg-gradient-to-br from-rose-500 to-orange-500'
            }`}
          >
            {player.id === 0 ? 'P1' : 'P2'}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium text-white/50">{position === 'top' ? '对手区域' : '当前玩家'}</div>
            <div className="mt-1 text-xl font-semibold text-white">{player.id === 0 ? '玩家 1' : '玩家 2'}</div>
            <div className="mt-1 text-sm leading-6 text-[#9e94b6]">
              {isActive ? '正在行动' : isCurrentPlayer ? '等待你的回合' : '等待对手行动'}
            </div>
          </div>

          <div className="ml-auto text-right xl:hidden">
            <div className="text-xs font-medium text-white/45">得分</div>
            <div className="mt-1 text-2xl font-semibold text-white">{player.score}</div>
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_190px_minmax(220px,0.9fr)]">
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-medium text-white/50">宝石库存与折扣</div>
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
              {ALL_GEM_TYPES.map((gem) => (
                <div key={gem} className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-2 py-3">
                  <GemToken gemType={gem} size="md" count={player.inventory[gem]} />
                  <div className="text-[11px] text-white/55">{GEM_DISPLAY_NAMES[gem]}</div>
                  {gem !== GemType.Gold && gem !== GemType.Pearl ? (
                    <div className="text-[11px] font-medium text-emerald-300">折扣 +{player.bonuses[gem]}</div>
                  ) : (
                    <div className="text-[11px] text-white/28">不可折扣</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/50">得分与皇冠</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-semibold text-white">{player.score}</div>
                  <div className="text-sm text-white/45">当前分数</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-amber-300">{player.crowns}</div>
                  <div className="text-sm text-white/45">皇冠</div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/50">特权与能力</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {player.privileges > 0 ? (
                  Array.from({ length: player.privileges }).map((_, index) => (
                    <div
                      key={index}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/30 bg-gradient-to-br from-amber-200 to-amber-500 text-lg shadow-lg shadow-amber-500/15"
                    >
                      📜
                    </div>
                  ))
                ) : (
                  <div className="text-sm leading-6 text-[#9e94b6]">当前没有特权卷轴。</div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {ownedBonuses.length > 0 ? (
                  ownedBonuses.map((gem) => (
                    <div
                      key={gem}
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100"
                    >
                      {GEM_DISPLAY_NAMES[gem]} +{player.bonuses[gem]}
                    </div>
                  ))
                ) : (
                  <div className="text-sm leading-6 text-[#9e94b6]">还没有建立永久折扣。</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-white/50">预留卡牌</div>
                <div className="mt-1 text-sm leading-6 text-[#9e94b6]">最多 3 张，当前 {player.reservedCards.length} 张。</div>
              </div>
            </div>

            {player.reservedCards.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
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
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm leading-6 text-[#9e94b6]">
                暂无预留卡牌。
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayerPanel;
