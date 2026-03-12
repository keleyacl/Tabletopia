// ============================================================
// 璀璨宝石·对决 - 能力解决交互组件
// ============================================================

import React from 'react';
import { CardAbility, GemType, Coord } from '@splendor/shared';
import { GEM_DISPLAY_NAMES } from '@splendor/shared';
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
  const setMessage = useGameStore((s) => s.setMessage);

  const { pendingAbility } = gameState;
  if (!pendingAbility) return null;

  const { ability, card, bonusColor } = pendingAbility;

  const skipCurrentAbility = () => {
    useGameStore.setState((state) => {
      state.gameState.pendingAbility = null;
      state.gameState.turnPhase = 'OptionalAfter';
      state.highlightedSlots = [];
      state.message = '已跳过当前能力';
      state.messageType = 'info';
    });
  };

  const actionChips =
    ability === CardAbility.TakeToken && bonusColor
      ? getAvailableTakeTokenCoords(gameState, bonusColor)
      : ability === CardAbility.RobToken
        ? getAvailableRobTokenTypes(gameState)
        : getAvailableCopyColors(gameState, card.id);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#05030d]/84 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-white/10 bg-[#151224]/95 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.46)]">
        <div className="text-xs font-medium text-white/50">能力解决</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">处理卡牌能力</h3>

        {ability === CardAbility.TakeToken && bonusColor && (
          <div className="mt-4">
            <p className="text-sm leading-7 text-[#cdbfe2]">
              选择 1 个 <span className="font-semibold text-white">{GEM_DISPLAY_NAMES[bonusColor]}</span> 宝石。
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {(actionChips as Coord[]).map((coord) => (
                <button
                  key={`${coord.x}-${coord.y}`}
                  onClick={() => doResolveAbility({ type: 'ResolveAbility', coord })}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <GemToken gemType={bonusColor} size="sm" />
                  <span>坐标 ({coord.x}, {coord.y})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {ability === CardAbility.RobToken && (
          <div className="mt-4">
            <p className="text-sm leading-7 text-[#cdbfe2]">选择一种非黄金宝石，从对手处抢夺 1 个。</p>

            <div className="mt-4 flex flex-wrap gap-3">
              {(actionChips as GemType[]).map((gem) => (
                <button
                  key={gem}
                  onClick={() => doResolveAbility({ type: 'ResolveAbility', gemType: gem })}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <GemToken gemType={gem} size="sm" />
                  <span>{GEM_DISPLAY_NAMES[gem]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {ability === CardAbility.CopyColor && (
          <div className="mt-4">
            <p className="text-sm leading-7 text-[#cdbfe2]">选择一种颜色，作为这张卡的永久折扣。</p>

            <div className="mt-4 flex flex-wrap gap-3">
              {(actionChips as GemType[]).map((gem) => (
                <button
                  key={gem}
                  onClick={() => doResolveAbility({ type: 'ResolveAbility', copyColor: gem })}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <GemToken gemType={gem} size="sm" />
                  <span>{GEM_DISPLAY_NAMES[gem]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {actionChips.length === 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-[#cdbfe2]">
            当前没有可执行的选项，可以直接跳过这一能力。
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setMessage(null);
              skipCurrentAbility();
            }}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/[0.09]"
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbilityResolver;
