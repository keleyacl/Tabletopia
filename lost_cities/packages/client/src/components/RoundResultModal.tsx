// ============================================================
// 失落的城市 - 局结算弹窗
// ============================================================

import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { calcMatchWins } from '@lost-cities/game-logic';

export const RoundResultModal: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const roomState = useGameStore((s) => s.roomState);
  const roundContinueSent = useGameStore((s) => s.roundContinueSent);
  const roundResultSeenKey = useGameStore((s) => s.roundResultSeenKey);
  const continueRound = useGameStore((s) => s.continueRound);
  const setRoundResultSeenKey = useGameStore((s) => s.setRoundResultSeenKey);

  const playerIndex = roomState?.playerIndex ?? -1;
  const myPlayer = roomState?.players?.find((p) => p.id === roomState?.you);
  const opponentPlayer = roomState?.players?.find(
    (p) => p.id !== roomState?.you
  );
  const myName = myPlayer?.name || '你';
  const opponentName = opponentPlayer?.name || '等待对手';

  const roundResult = gameState?.roundResult || null;
  const roundResultKey = roundResult
    ? `${roundResult.roundIndex}:${roundResult.scores?.[0] ?? 0}:${roundResult.scores?.[1] ?? 0}`
    : '';

  const showModal =
    !!roundResult &&
    (roundResult.canContinue || roundResultSeenKey !== roundResultKey);

  const roundResultWinnerText = useMemo(() => {
    if (!roundResult) return '';
    if (roundResult.winner === -1) return '本局平局';
    if (roundResult.winner === playerIndex) return `${myName} 赢下本局`;
    return `${opponentName} 赢下本局`;
  }, [roundResult, playerIndex, myName, opponentName]);

  const roundResultMyScore =
    roundResult && playerIndex !== -1
      ? (roundResult.scores?.[playerIndex] ?? 0)
      : 0;
  const roundResultOpponentScore =
    roundResult && playerIndex !== -1
      ? (roundResult.scores?.[playerIndex === 0 ? 1 : 0] ?? 0)
      : 0;

  const roundResultMatchWins = useMemo(() => {
    if (
      roundResult &&
      Array.isArray(roundResult.matchWins) &&
      playerIndex !== -1
    ) {
      return {
        you: roundResult.matchWins[playerIndex] ?? 0,
        opponent: roundResult.matchWins[playerIndex === 0 ? 1 : 0] ?? 0,
      };
    }
    const matchWinsArr = calcMatchWins(gameState?.history);
    return {
      you: playerIndex !== -1 ? matchWinsArr[playerIndex] : 0,
      opponent: playerIndex !== -1 ? matchWinsArr[playerIndex === 0 ? 1 : 0] : 0,
    };
  }, [roundResult, gameState?.history, playerIndex]);

  if (!showModal) return null;

  return (
    <div
      className="modal-backdrop result-backdrop"
      onClick={() => {
        if (!roundResult?.canContinue) {
          setRoundResultSeenKey(roundResultKey);
        }
      }}
    >
      <div className="modal result-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{roundResultWinnerText}</h3>
        <div className="notice">
          本局分数 你 {roundResultMyScore} : 对手 {roundResultOpponentScore}
        </div>
        <div className="notice">
          当前比分(赢局) {myName} {roundResultMatchWins.you} :{' '}
          {roundResultMatchWins.opponent} {opponentName}
        </div>
        <div className="modal-actions">
          {roundResult?.canContinue ? (
            <button onClick={continueRound} disabled={roundContinueSent}>
              {roundContinueSent
                ? `已继续，等待对方… (${roundResult.readyCount ?? 1}/2)`
                : '继续'}
            </button>
          ) : (
            <button onClick={() => setRoundResultSeenKey(roundResultKey)}>
              知道了
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
