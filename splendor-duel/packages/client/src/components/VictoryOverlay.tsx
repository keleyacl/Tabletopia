// ============================================================
// 璀璨宝石·对决 - 胜利弹窗组件
// 华丽的胜利动画，显示胜利类型和最终分数
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center animate-pop-in">
        {/* 光效背景 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(245,158,11,0.4) 0%, transparent 70%)',
          }}
        />

        {/* 胜利内容 */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* 皇冠动画 */}
          <div className="text-6xl animate-float">👑</div>

          {/* 胜利标题 */}
          <h2
            className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500
                       bg-clip-text text-transparent drop-shadow-lg"
          >
            胜利！
          </h2>

          {/* 获胜玩家 */}
          <div className="flex items-center gap-3">
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                ${winner.id === 0
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  : 'bg-gradient-to-br from-rose-500 to-pink-600'
                }
                shadow-xl animate-glow-pulse
              `}
              style={{
                ['--glow-color' as any]: winner.id === 0
                  ? 'rgba(6,182,212,0.6)'
                  : 'rgba(244,63,94,0.6)',
              }}
            >
              {winner.id === 0 ? 'P1' : 'P2'}
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                玩家 {winner.id + 1}
              </div>
              <div className="text-sm text-gray-400">获得胜利</div>
            </div>
          </div>

          {/* 胜利详情 */}
          <div className="px-6 py-3 rounded-xl bg-gray-800/60 border border-amber-500/20">
            <p className="text-amber-300 text-sm">{details}</p>
          </div>

          {/* 最终数据 */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{winner.score}</div>
              <div className="text-xs text-gray-400">总分</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{winner.crowns}</div>
              <div className="text-xs text-gray-400">皇冠</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {winner.purchasedCards.length}
              </div>
              <div className="text-xs text-gray-400">卡牌</div>
            </div>
          </div>

          {/* 重新开始按钮 */}
          <button
            onClick={initGame}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600
                       text-white font-bold text-lg
                       hover:from-purple-500 hover:to-indigo-500
                       transition-all duration-200 shadow-xl shadow-purple-500/30
                       hover:shadow-purple-500/50"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryOverlay;
