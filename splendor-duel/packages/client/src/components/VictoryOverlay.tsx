// ============================================================
// 璀璨宝石·对决 - 胜利弹窗组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getVictoryDetails } from '@splendor/game-logic';

const VictoryOverlay: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const showVictoryOverlay = useGameStore((s) => s.showVictoryOverlay);
  const initGame = useGameStore((s) => s.initGame);

  if (!showVictoryOverlay || gameState.winner === null) return null;

  const winner = gameState.players[gameState.winner];
  const { details } = getVictoryDetails(winner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05030d]/84 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-amber-300/18 bg-[#151224]/95 p-8 shadow-[0_26px_90px_rgba(0,0,0,0.46)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%)]" />

        <div className="relative text-center">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-amber-200/60">Victory</div>
          <div className="mt-4 text-6xl">👑</div>
          <h2 className="mt-4 text-4xl font-semibold text-white">胜利</h2>
          <p className="mt-3 text-sm leading-7 text-[#cdbfe2]">{details}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/45">获胜玩家</div>
              <div className="mt-2 text-2xl font-semibold text-white">玩家 {winner.id + 1}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/45">总分</div>
              <div className="mt-2 text-2xl font-semibold text-white">{winner.score}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-white/45">皇冠</div>
              <div className="mt-2 text-2xl font-semibold text-amber-300">{winner.crowns}</div>
            </div>
          </div>

          <button
            onClick={initGame}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryOverlay;
