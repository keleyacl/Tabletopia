// ============================================================
// 斋浦尔 - 游戏结束弹窗组件（支持局结束和比赛结束两种模式）
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/** 数字从 0 滚动到目标值的 Hook */
function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCurrent(0);
      return;
    }
    if (target === 0) {
      setCurrent(0);
      return;
    }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return current;
}

/** 局结束分项计算动画组件 */
const RoundScoreBreakdown: React.FC<{
  tokenScore: number;
  bonusScore: number;
  camelScore: number;
  totalScore: number;
  label: string;
  colorClass: string;
}> = ({ tokenScore, bonusScore, camelScore, totalScore, label, colorClass }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(1), 300));
    timers.push(setTimeout(() => setStep(2), 800));
    timers.push(setTimeout(() => setStep(3), 1300));
    timers.push(setTimeout(() => setStep(4), 1900));
    return () => timers.forEach(clearTimeout);
  }, []);

  const tokenVal = useCountUp(tokenScore, 400, step >= 1);
  const bonusVal = useCountUp(bonusScore, 400, step >= 2);
  const camelVal = useCountUp(camelScore, 400, step >= 3);
  const totalVal = useCountUp(totalScore, 500, step >= 4);

  return (
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-bold mb-2 ${colorClass}`}>{label}</div>
      <div className="space-y-1.5">
        <div
          className={`flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm transition-all duration-300 ${
            step >= 1 ? 'animate-fade-slide-in opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-gray-600">💰 货物标记</span>
          <span className={`font-bold ${colorClass}`}>{step >= 1 ? tokenVal : 0}</span>
        </div>
        <div
          className={`flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm transition-all duration-300 ${
            step >= 2 ? 'animate-fade-slide-in opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-gray-600">🏆 奖励标记</span>
          <span className={`font-bold ${colorClass}`}>{step >= 2 ? bonusVal : 0}</span>
        </div>
        <div
          className={`flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm transition-all duration-300 ${
            step >= 3 ? 'animate-fade-slide-in opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-gray-600">🐪 骆驼王</span>
          <span className={`font-bold ${colorClass}`}>{step >= 3 ? camelVal : 0}</span>
        </div>
        <div
          className={`flex justify-between items-center bg-white/80 px-2 py-1.5 rounded border-t border-gray-200 transition-all duration-300 ${
            step >= 4 ? 'animate-fade-slide-in opacity-100' : 'opacity-0'
          }`}
        >
          <span className={`font-bold text-sm ${colorClass}`}>合计</span>
          <span className={`font-bold text-lg ${colorClass}`}>{step >= 4 ? totalVal : 0}</span>
        </div>
      </div>
    </div>
  );
};

const GameOverModal: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const roomState = useGameStore((state) => state.roomState);
  const playerIndex = useGameStore((state) => state.playerIndex);
  const nextRound = useGameStore((state) => state.nextRound);
  const rematch = useGameStore((state) => state.rematch);

  if ((roomState !== 'round_over' && roomState !== 'finished') || !gameState) return null;

  const { myPlayer, opponent, winner, roundWins, currentRound, matchWinner, roundResults } = gameState;
  const isRoundOver = roomState === 'round_over';
  const isMatchFinished = roomState === 'finished';

  if (isRoundOver) {
    const isRoundWinner = winner === playerIndex;
    const isRoundDraw = winner === null;

    const myTokenScore = myPlayer.tokens.reduce((sum: number, v: number) => sum + v, 0);
    const myBonusScore = myPlayer.bonusTokens.reduce((sum: number, v: number) => sum + v, 0);
    const myCamelScore = Math.max(0, myPlayer.score - myTokenScore - myBonusScore);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
          <div className="text-center mb-5">
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

          <div className="flex justify-center items-center gap-4 mb-5">
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

          <div className="flex gap-4 mb-5">
            <RoundScoreBreakdown
              tokenScore={myTokenScore}
              bonusScore={myBonusScore}
              camelScore={myCamelScore}
              totalScore={myPlayer.score}
              label="我的得分"
              colorClass="text-[var(--color-primary)]"
            />
            <div className="w-px bg-gray-200 self-stretch" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold mb-2 text-gray-600">对手得分</div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm">
                  <span className="text-gray-600">💰 货物标记</span>
                  <span className="font-bold text-gray-600">{opponent.tokenCount}</span>
                </div>
                <div className="flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm">
                  <span className="text-gray-600">🏆 奖励标记</span>
                  <span className="font-bold text-gray-600">{opponent.bonusTokenCount}</span>
                </div>
                <div className="flex justify-between items-center bg-white/60 px-2 py-1 rounded text-sm">
                  <span className="text-gray-600">🐪 骆驼王</span>
                  <span className="font-bold text-gray-600">—</span>
                </div>
                <div className="flex justify-between items-center bg-white/80 px-2 py-1.5 rounded border-t border-gray-200">
                  <span className="font-bold text-sm text-gray-600">合计</span>
                  <span className="font-bold text-lg text-gray-600">{opponent.score}</span>
                </div>
              </div>
            </div>
          </div>

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
