import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useRoomStore } from '../store/roomStore';
import FactoryCircle from '../components/FactoryCircle';
import PlayerBoardComponent from '../components/PlayerBoard';
import ScoreBoard from '../components/ScoreBoard';
import GameOverModal from '../components/GameOverModal';
import '../styles/components.css';

// ============================================================
// 游戏主页面
// ============================================================

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const showRoundScore = useGameStore((s) => s.showRoundScore);
  const roundScoreDetails = useGameStore((s) => s.roundScoreDetails);
  const dismissRoundScore = useGameStore((s) => s.dismissRoundScore);
  const roomInfo = useRoomStore((s) => s.roomInfo);

  // 如果没有游戏状态，跳回大厅
  useEffect(() => {
    if (!gameState && !roomInfo) {
      navigate('/');
    }
  }, [gameState, roomInfo, navigate]);

  if (!gameState) {
    return (
      <div className="game-page">
        <div className="game-loading">加载游戏中...</div>
      </div>
    );
  }

  const isMyTurn =
    gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId;

  // 找到"我"的玩家板，放在最下方
  const myPlayerIndex = gameState.players.findIndex(
    (p) => p.id === myPlayerId
  );
  const otherPlayers = gameState.players.filter(
    (p) => p.id !== myPlayerId
  );
  const myPlayer =
    myPlayerIndex !== -1 ? gameState.players[myPlayerIndex] : null;

  return (
    <div className="game-page">
      {/* 顶部信息栏 */}
      <div className="game-top-bar">
        <div className="game-room-id">房间: {roomId}</div>
        <div className="game-turn-info">
          {gameState.phase === 'END' ? (
            <span className="phase-end">游戏结束</span>
          ) : isMyTurn ? (
            <span className="phase-my-turn">你的回合 - 请选择瓷砖</span>
          ) : (
            <span className="phase-waiting">
              等待 {gameState.players[gameState.currentPlayerIndex]?.name} 行动...
            </span>
          )}
        </div>
        <ScoreBoard
          players={gameState.players}
          currentPlayerIndex={gameState.currentPlayerIndex}
          round={gameState.round}
          myPlayerId={myPlayerId}
        />
      </div>

      {/* 主游戏区域 */}
      <div className="game-main">
        {/* 工厂区域 */}
        <div className="game-factory-area">
          <FactoryCircle
            factories={gameState.factories}
            centerPot={gameState.centerPot}
            isMyTurn={isMyTurn && gameState.phase === 'PICKING'}
          />
        </div>

        {/* 其他玩家的板 */}
        <div className="game-other-players">
          {otherPlayers.map((player) => (
            <PlayerBoardComponent
              key={player.id}
              player={player}
              isActivePlayer={
                gameState.players[gameState.currentPlayerIndex]?.id ===
                player.id
              }
              isMe={false}
            />
          ))}
        </div>
      </div>

      {/* 我的玩家板（底部） */}
      {myPlayer && (
        <div className="game-my-board">
          <PlayerBoardComponent
            player={myPlayer}
            isActivePlayer={isMyTurn}
            isMe={true}
          />
        </div>
      )}

      {/* 错误提示 */}
      {errorMessage && (
        <div className="game-error-toast">{errorMessage}</div>
      )}

      {/* 回合计分提示 */}
      {showRoundScore && roundScoreDetails && (
        <div className="modal-overlay" onClick={dismissRoundScore}>
          <div
            className="modal-content round-score-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>回合计分</h3>
            <div className="round-score-list">
              {roundScoreDetails.map((detail) => {
                const player = gameState.players.find(
                  (p) => p.id === detail.playerId
                );
                return (
                  <div key={detail.playerId} className="round-score-item">
                    <div className="round-score-name">
                      {player?.name || '未知'}
                    </div>
                    <div className="round-score-details">
                      {detail.tilesPlaced.length > 0 && (
                        <span className="score-gain">
                          +
                          {detail.tilesPlaced.reduce(
                            (sum, t) => sum + t.score,
                            0
                          )}
                        </span>
                      )}
                      {detail.floorPenalty < 0 && (
                        <span className="score-loss">
                          {detail.floorPenalty}
                        </span>
                      )}
                      <span className="score-total">
                        = {detail.totalRoundScore > 0 ? '+' : ''}
                        {detail.totalRoundScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-primary"
              onClick={dismissRoundScore}
            >
              继续
            </button>
          </div>
        </div>
      )}

      {/* 游戏结束弹窗 */}
      <GameOverModal />
    </div>
  );
};

export default GamePage;
