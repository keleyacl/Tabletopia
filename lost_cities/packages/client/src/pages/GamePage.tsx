// ============================================================
// 失落的城市 - 游戏页面
// ============================================================

import React, { useMemo, useCallback } from 'react';
import { COLOR_INFO } from '@lost-cities/shared';
import { scoreExpedition } from '@lost-cities/game-logic';
import { useGameStore, copyText, buildInviteLink } from '../store/gameStore';
import { ExpeditionRow } from '../components/ExpeditionRow';
import { DiscardPile } from '../components/DiscardPile';
import { HandZone } from '../components/HandZone';
import { RoundResultModal } from '../components/RoundResultModal';
import { RulesModal } from '../components/RulesModal';
import { ChatPanel } from '../components/ChatPanel';
import { ActionHistory } from '../components/ActionHistory';
import { ToastStack } from '../components/ToastStack';

const GamePage: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const gameState = useGameStore((s) => s.gameState);
  const connected = useGameStore((s) => s.connected);
  const showGameMenu = useGameStore((s) => s.showGameMenu);
  const setShowGameMenu = useGameStore((s) => s.setShowGameMenu);
  const setShowRulesModal = useGameStore((s) => s.setShowRulesModal);
  const restartGame = useGameStore((s) => s.restartGame);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const drawCard = useGameStore((s) => s.drawCard);
  const pushToast = useGameStore((s) => s.pushToast);
  const phaseAction = useGameStore((s) => s.phaseAction);
  const copied = useGameStore((s) => s.copied);
  const setCopied = useGameStore((s) => s.setCopied);
  const inviteCopied = useGameStore((s) => s.inviteCopied);
  const setInviteCopied = useGameStore((s) => s.setInviteCopied);

  const playerIndex = roomState?.playerIndex ?? -1;
  const myPlayer = roomState?.players?.find((p) => p.id === roomState?.you);
  const opponentPlayer = roomState?.players?.find(
    (p) => p.id !== roomState?.you
  );
  const myName = myPlayer?.name || '你';
  const opponentName = opponentPlayer?.name || '等待对手';
  const connectedPlayersCount =
    roomState?.players?.filter((p) => p.connected !== false).length ?? 0;
  const hasTwoPlayers = connectedPlayersCount >= 2;
  const waitingForOpponent = !!roomState && !hasTwoPlayers;
  const isMyTurn = gameState && gameState.turn === playerIndex;

  const matchWins = useMemo(() => {
    if (
      Array.isArray(gameState?.matchWins) &&
      playerIndex !== -1
    ) {
      return {
        you: gameState!.matchWins[playerIndex] ?? 0,
        opponent: gameState!.matchWins[playerIndex === 0 ? 1 : 0] ?? 0,
      };
    }
    return { you: 0, opponent: 0 };
  }, [gameState?.matchWins, playerIndex]);

  const liveRoundScores = useMemo(() => {
    if (!gameState) return null;
    const yourTotal = Object.values(gameState.your.expeditions).reduce(
      (acc, exp) => acc + scoreExpedition(exp),
      0
    );
    const opponentTotal = Object.values(gameState.opponent.expeditions).reduce(
      (acc, exp) => acc + scoreExpedition(exp),
      0
    );
    return { you: yourTotal, opponent: opponentTotal };
  }, [gameState]);

  const copyRoomCode = useCallback(async () => {
    const code = roomState?.code;
    if (!code) return;
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      pushToast('房间号已复制');
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    pushToast('复制失败，请手动复制房间号');
  }, [roomState?.code, pushToast, setCopied]);

  const copyInviteLink = useCallback(async () => {
    const code = roomState?.code;
    if (!code) return;
    const inviteLink = buildInviteLink(code);
    const ok = await copyText(inviteLink);
    if (ok) {
      setInviteCopied(true);
      pushToast('邀请链接已复制');
      setTimeout(() => setInviteCopied(false), 1500);
      return;
    }
    pushToast('邀请链接复制失败，请手动复制');
  }, [roomState?.code, pushToast, setInviteCopied]);

  if (!roomState || !gameState) return null;

  return (
    <div>
      <header>
        <h1>Lost Cities</h1>
        <div className="header-right">
          <div className="header-meta">
            <div className="info-chip info-room header-chip">
              <span>房间 {roomState.code}</span>
              <button
                className="chip-action"
                onClick={copyRoomCode}
                title="复制房间号"
              >
                {copied ? '已复制' : '复制'}
              </button>
              <button
                className="chip-action"
                onClick={copyInviteLink}
                title="复制邀请链接"
              >
                {inviteCopied ? '链接已复制' : '邀请链接'}
              </button>
              <span className="chip-meta">
                {gameState.roundIndex}/
                {gameState.roundsTotal === 0 ? '∞' : gameState.roundsTotal}
              </span>
            </div>
            <div
              className={`info-chip header-chip header-score ${isMyTurn ? 'highlight' : ''}`}
            >
              {myName} vs {opponentName} · 总分(赢局) {matchWins.you} :{' '}
              {matchWins.opponent} · 本局分 {liveRoundScores?.you ?? 0} :{' '}
              {liveRoundScores?.opponent ?? 0}
            </div>
          </div>
          <div className="menu-wrap">
            <button
              className="secondary menu-btn"
              onClick={() => setShowGameMenu(!showGameMenu)}
            >
              菜单
            </button>
            {showGameMenu && (
              <div className="menu-dropdown">
                <button className="secondary" onClick={restartGame}>
                  重新开始
                </button>
                <button className="secondary" onClick={leaveRoom}>
                  退出房间
                </button>
              </div>
            )}
          </div>
          <div className="badge">{connected ? '已连接' : '未连接'}</div>
        </div>
      </header>

      <ToastStack />
      <RulesModal />
      <RoundResultModal />

      {waitingForOpponent && (
        <div className="modal-backdrop waiting-backdrop">
          <div className="modal waiting-modal">
            <h3>等待另一位玩家加入</h3>
            <div className="waiting-room-line">
              <span className="waiting-room-code">
                房间号 {roomState.code}
              </span>
              <button
                className="chip-action"
                onClick={copyRoomCode}
                title="复制房间号"
              >
                {copied ? '已复制' : '复制'}
              </button>
              <button
                className="chip-action"
                onClick={copyInviteLink}
                title="复制邀请链接"
              >
                {inviteCopied ? '链接已复制' : '邀请链接'}
              </button>
            </div>
            <div className="notice">
              当前 {connectedPlayersCount}/2 人，双方进入后自动开始游戏。
            </div>
          </div>
        </div>
      )}

      {!waitingForOpponent && <ActionHistory />}
      <ChatPanel />

      <main>
        <div className="wood-frame">
          <div className="felt-surface">
            <div className="table-area">
              <section className="table-zone">
                <h3>对手探险列 · {opponentName}</h3>
                {COLOR_INFO.map((color) => (
                  <ExpeditionRow
                    key={color.id}
                    colorId={color.id}
                    colorName={color.name}
                    expedition={gameState.opponent.expeditions[color.id]}
                  />
                ))}
              </section>

              <section className="table-zone center-zone">
                <div className="center-piles">
                  <DiscardPile
                    discardTops={gameState.discardTops}
                    selectable={phaseAction === 'draw'}
                    onDraw={(color) => drawCard('discard', color)}
                  />

                  <div className="stack">
                    <h3>抽牌堆</h3>
                    <div
                      className={`card card-back deck-pile ${phaseAction === 'draw' ? 'selectable' : ''}`}
                      onClick={() =>
                        phaseAction === 'draw' && drawCard('deck')
                      }
                    >
                      <div className="label">抽牌</div>
                      <div className="value">{gameState.deckCount}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="table-zone">
                <h3>你的探险列 · {myName}</h3>
                {COLOR_INFO.map((color) => (
                  <ExpeditionRow
                    key={color.id}
                    colorId={color.id}
                    colorName={color.name}
                    expedition={gameState.your.expeditions[color.id]}
                  />
                ))}
              </section>
            </div>

            <HandZone myName={myName} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePage;
