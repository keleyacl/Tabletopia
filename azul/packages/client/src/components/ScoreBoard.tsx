import React from 'react';
import { PlayerBoard } from '@azul/shared';

// ============================================================
// 计分板组件
// ============================================================

interface ScoreBoardProps {
  /** 所有玩家 */
  players: PlayerBoard[];
  /** 当前行动玩家索引 */
  currentPlayerIndex: number;
  /** 当前回合数 */
  round: number;
  /** 我的玩家 ID */
  myPlayerId: string;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  currentPlayerIndex,
  round,
  myPlayerId,
}) => {
  // 按分数排序（降序）
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="score-board">
      <div className="score-board-header">
        <h3>计分板</h3>
        <div className="round-info">第 {round} 轮</div>
      </div>
      <div className="score-board-list">
        {sortedPlayers.map((player, index) => {
          const isActive =
            players[currentPlayerIndex]?.id === player.id;
          const isMe = player.id === myPlayerId;

          return (
            <div
              key={player.id}
              className={`score-board-item ${isActive ? 'active' : ''} ${
                isMe ? 'me' : ''
              }`}
            >
              <div className="score-board-rank">{index + 1}</div>
              <div className="score-board-name">
                {player.name}
                {isMe && <span className="me-tag"> (我)</span>}
              </div>
              <div className="score-board-score">{player.score}</div>
              {isActive && <div className="score-board-turn-indicator">◀</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBoard;
