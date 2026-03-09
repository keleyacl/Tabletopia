// ============================================================
// 斋浦尔 - 游戏结束弹窗组件（支持局结束和比赛结束两种模式）
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const GameOverModal: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const roomState = useGameStore((state) => state.roomState);
  const playerIndex = useGameStore((state) => state.playerIndex);
  const nextRound = useGameStore((state) => state.nextRound);
  const rematch = useGameStore((state) => state.rematch);

  // 只在局结束或比赛结束时显示
  if ((roomState !== 'round_over' && roomState !== 'finished') || !gameState) return null;

  const { myPlayer, opponent, winner, roundWins, currentRound, matchWinner, roundResults } = gameState;
  const isRoundOver = roomState === 'round_over';
  const isMatchFinished = roomState === 'finished';

  // 局结束弹窗
  if (isRoundOver) {
    const isRoundWinner = winner === playerIndex;
    const isRoundDraw = winner === null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
          <div className="text-center mb-6">
            {isRoundWinner && <div className="text-5xl mb-3">🎉</div>}
            {isRoundDraw && <div className="text-5xl mb-3">🤝</div>}
            {!isRoundWinner && !isRoundDraw && <div className="text-5xl mb-3">😤</div>}

            <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">
              第 {currentRound} 局结束
            </h2>
            <p className="text-gray-600">
              {isRoundWinner ? '你赢得了本局！' : isRoundDraw ? '本局平局！' : '本局对手获胜'}
            </p>
          </div>

          {/* 比分进度 */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">我</div>
              <div className="text-3xl font-bold text-[var(--color-primary)]">{playerIndex === 0 ? roundWins[0] : roundWins[1]}</div>
            </div>
            <div className="text-2xl text-gray-400">:</div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">对手</div>
              <div className="text-3xl font-bold text-gray-600">{playerIndex === 0 ? roundWins[1] : roundWins[0]}</div>
            </div>
          </div>

          {/* 本局分数对比 */}
          <div className="space-y-3 mb-6">
            <div className="bg-white/50 p-3 rounded-lg flex justify-between items-center">
              <span className="font-bold text-[var(--color-primary)]">我的得分</span>
              <span className="text-xl font-bold text-[var(--color-primary)]">{myPlayer.score}</span>
            </div>
            <div className="bg-white/50 p-3 rounded-lg flex justify-between items-center">
              <span className="font-bold text-gray-600">对手得分</span>
              <span className="text-xl font-bold text-gray-600">{opponent.score}</span>
            </div>
          </div>

          {/* 开始下一局 */}
          <div className="text-center">
            <button
              onClick={nextRound}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              开始下一局
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 比赛结束弹窗
  if (isMatchFinished) {
    const isMatchWinner = matchWinner === playerIndex;
    const isMatchDraw = matchWinner === null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
          <div className="text-center mb-6">
            {isMatchWinner && <div className="text-6xl mb-4">🏆</div>}
            {isMatchDraw && <div className="text-6xl mb-4">🤝</div>}
            {!isMatchWinner && !isMatchDraw && <div className="text-6xl mb-4">😢</div>}

            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
              {isMatchWinner ? '恭喜获胜！' : isMatchDraw ? '平局！' : '比赛结束'}
            </h2>
            <p className="text-gray-600">
              {isMatchWinner ? '你成为了最富有的商人！' : isMatchDraw ? '势均力敌的比赛！' : '下次继续努力！'}
            </p>
          </div>

          {/* 最终比分 */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">我</div>
              <div className="text-4xl font-bold text-[var(--color-primary)]">{playerIndex === 0 ? roundWins[0] : roundWins[1]}</div>
            </div>
            <div className="text-2xl text-gray-400">:</div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">对手</div>
              <div className="text-4xl font-bold text-gray-600">{playerIndex === 0 ? roundWins[1] : roundWins[0]}</div>
            </div>
          </div>

          {/* 每局详情 */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-bold text-gray-500 text-center">每局详情</h3>
            {roundResults.map((result, index) => {
              const myScore = playerIndex === 0 ? result.scores[0] : result.scores[1];
              const opponentScore = playerIndex === 0 ? result.scores[1] : result.scores[0];
              const iWon = result.winner === playerIndex;
              const draw = result.winner === null;
              return (
                <div key={index} className="bg-white/50 p-2 rounded-lg flex justify-between items-center text-sm">
                  <span className="text-gray-500">第 {index + 1} 局</span>
                  <span className={`font-bold ${iWon ? 'text-green-600' : draw ? 'text-gray-500' : 'text-red-500'}`}>
                    {myScore} : {opponentScore}
                    {iWon ? ' 胜' : draw ? ' 平' : ' 负'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={rematch}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              再来一场
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              返回大厅
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameOverModal;
