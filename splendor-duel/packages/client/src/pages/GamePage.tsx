// ============================================================
// 璀璨宝石·对决 - 游戏主页面
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import GemBoard from '../components/GemBoard';
import CardDisplay from '../components/CardDisplay';
import PlayerPanel from '../components/PlayerPanel';
import PrivilegeToken from '../components/PrivilegeToken';
import ActionBar from '../components/ActionBar';
import DiscardModal from '../components/DiscardModal';
import AbilityResolver from '../components/AbilityResolver';
import VictoryOverlay from '../components/VictoryOverlay';

const shellPanelClass =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-[#120d22]/90 shadow-[0_18px_60px_rgba(0,0,0,0.36)] backdrop-blur-xl';
const microLabelClass = 'text-xs font-medium text-white/50';
const phaseLabels: Record<string, string> = {
  OptionalBefore: '回合开始',
  Main: '主动作阶段',
  OptionalAfter: '主动作完成',
  ResolveAbilities: '解决能力',
  DiscardExcess: '丢弃宝石',
};

const GamePage: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const initGame = useGameStore((s) => s.initGame);

  const { currentPlayerIndex, players, privilegePool, turnPhase, hasPerformedMainAction } = gameState;

  const topPlayer = players[1];
  const bottomPlayer = players[0];
  const topIsActive = currentPlayerIndex === 1;
  const bottomIsActive = currentPlayerIndex === 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070512] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#080612] via-[#130a25] to-[#04060b]" />
      <div className="pointer-events-none absolute left-[-12%] top-[-16%] h-96 w-96 rounded-full bg-fuchsia-500/16 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-18%] right-[-10%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[22%] top-[18%] h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <header className={`${shellPanelClass} p-5 sm:p-6`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%)]" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-fuchsia-100/55">
                  Splendor Duel
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  对局进行中
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">璀璨宝石·对决</h1>
                <p className="mt-2 max-w-2xl text-sm leading-8 text-[#cbbfdd] sm:text-base">
                  在中央棋盘争夺宝石、购入发展卡、抢占节奏。所有操作都围绕这一桌展开。
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className={microLabelClass}>当前玩家</div>
                <div className="mt-2 text-lg font-semibold text-white">玩家 {currentPlayerIndex + 1}</div>
                <div className="mt-1 text-sm text-[#9d93b5]">{hasPerformedMainAction ? '主动作已完成' : '等待执行主动作'}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className={microLabelClass}>回合阶段</div>
                <div className="mt-2 text-lg font-semibold text-white">{phaseLabels[turnPhase] ?? turnPhase}</div>
                <div className="mt-1 text-sm text-[#9d93b5]">特权与能力会在不同阶段开放。</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className={microLabelClass}>公共特权池</div>
                <div className="mt-2 text-lg font-semibold text-white">{privilegePool} 枚</div>
                <button
                  onClick={initGame}
                  className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/[0.09]"
                >
                  重新开始
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-5">
          <ActionBar />
        </div>

        <div className="mt-5">
          <PlayerPanel
            player={topPlayer}
            isCurrentPlayer={currentPlayerIndex === 1}
            isActive={topIsActive}
            position="top"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_400px]">
          <section className={`${shellPanelClass} p-5 sm:p-6`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_26%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_110px] lg:items-start">
              <GemBoard />
              <PrivilegeToken count={privilegePool} />
            </div>
          </section>

          <section className={`${shellPanelClass} p-5 sm:p-6`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_22%)]" />
            <div className="relative">
              <CardDisplay />
            </div>
          </section>
        </div>

        <div className="mt-5">
          <PlayerPanel
            player={bottomPlayer}
            isCurrentPlayer={currentPlayerIndex === 0}
            isActive={bottomIsActive}
            position="bottom"
          />
        </div>
      </div>

      <DiscardModal />
      <AbilityResolver />
      <VictoryOverlay />
    </div>
  );
};

export default GamePage;
