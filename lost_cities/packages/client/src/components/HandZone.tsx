// ============================================================
// 失落的城市 - 手牌区组件
// ============================================================

import React, { useMemo } from 'react';
import type { Card as CardType } from '@lost-cities/shared';
import { COLOR_ORDER } from '@lost-cities/shared';
import { HandCard } from './Card';
import { useGameStore } from '../store/gameStore';

function sortHand(cards: CardType[] | undefined): CardType[] {
  if (!cards) return [];
  return [...cards].sort((a, b) => {
    const colorDiff = (COLOR_ORDER[a.color] ?? 0) - (COLOR_ORDER[b.color] ?? 0);
    if (colorDiff !== 0) return colorDiff;
    const typeWeight = (card: CardType) => (card.type === 'wager' ? 0 : 1);
    const typeDiff = typeWeight(a) - typeWeight(b);
    if (typeDiff !== 0) return typeDiff;
    if (a.type === 'number' && b.type === 'number') return a.value - b.value;
    return 0;
  });
}

interface HandZoneProps {
  myName: string;
}

export const HandZone: React.FC<HandZoneProps> = ({ myName }) => {
  const gameState = useGameStore((s) => s.gameState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);
  const playCard = useGameStore((s) => s.playCard);
  const roomState = useGameStore((s) => s.roomState);

  const playerIndex = roomState?.playerIndex ?? -1;
  const connectedCount =
    roomState?.players?.filter((p) => p.connected !== false).length ?? 0;
  const hasTwoPlayers = connectedCount >= 2;
  const roundPendingContinue = !!gameState?.roundResult?.canContinue;
  const isMyTurn = gameState && gameState.turn === playerIndex;
  const canPlay =
    hasTwoPlayers &&
    !roundPendingContinue &&
    isMyTurn &&
    gameState?.phase === 'play';

  const sortedHand = useMemo(
    () => sortHand(gameState?.your.hand),
    [gameState?.your.hand]
  );

  const selectedCard = useMemo(() => {
    if (!gameState || !selectedCardId) return null;
    return gameState.your.hand.find((c) => c.id === selectedCardId) || null;
  }, [gameState, selectedCardId]);

  return (
    <div className="stack hand-zone">
      <h3>你的手牌 · {myName}</h3>
      <div className="hand">
        {sortedHand.map((card) => (
          <HandCard
            key={card.id}
            card={card}
            active={!!canPlay}
            selected={selectedCardId === card.id}
            onSelect={() => {
              if (!canPlay) return;
              setSelectedCardId(
                selectedCardId === card.id ? null : card.id
              );
            }}
          />
        ))}
      </div>
      {selectedCard && (
        <div className="notice">
          已选择：{selectedCard.color}{' '}
          {selectedCard.type === 'wager' ? '投资' : selectedCard.value}
          <div
            className="stack"
            style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}
          >
            <button onClick={() => playCard('expedition')}>打入探险列</button>
            <button
              className="secondary"
              onClick={() => playCard('discard')}
            >
              弃牌
            </button>
          </div>
        </div>
      )}
      {gameState?.gameOver && (
        <div className="notice">比赛结束！最终得分已结算。</div>
      )}
      {!isMyTurn && <div className="notice">等待对手操作…</div>}
    </div>
  );
};
