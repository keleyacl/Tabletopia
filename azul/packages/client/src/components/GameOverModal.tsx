import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinalScoreDetail } from '@azul/shared';
import { useGameStore } from '../store/gameStore';
import { useRoomStore } from '../store/roomStore';

// ============================================================
// 游戏结束弹窗
// ============================================================

const GameOverModal: React.FC = () => {
  const navigate = useNavigate();
  const finalScores = useGameStore((s) => s.finalScores);
  const showGameOver = useGameStore((s) => s.showGameOver);
  const dismissGameOver = useGameStore((s) => s.dismissGameOver);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetRoom = useRoomStore((s) => s.resetRoom);

  if (!showGameOver || !finalScores) return null;

  // 按最终分数排序（降序）
  const sortedScores = [...finalScores].sort(
    (a, b) => b.finalScore - a.finalScore
  );

  const winner = sortedScores[0];

  const handleBackToLobby = () => {
    dismissGameOver();
    resetGame();
    resetRoom();
    navigate('/');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content game-over-modal">
        <h2 className="modal-title">游戏结束</h2>

        <div className="winner-section">
          <div className="winner-crown">👑</div>
          <div className="winner-name">{winner.playerName}</div>
          <div className="winner-score">{winner.finalScore} 分</div>
        </div>

        <div className="final-scores-table">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>玩家</th>
                <th>基础分</th>
                <th>行 (+2)</th>
                <th>列 (+7)</th>
                <th>全色 (+10)</th>
                <th>总分</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score, index) => (
                <tr key={score.playerId}>
                  <td className="rank-cell">{index + 1}</td>
                  <td className="name-cell">{score.playerName}</td>
                  <td>{score.baseScore}</td>
                  <td>
                    {score.completedRows > 0
                      ? `${score.completedRows} (+${score.rowBonus})`
                      : '-'}
                  </td>
                  <td>
                    {score.completedCols > 0
                      ? `${score.completedCols} (+${score.colBonus})`
                      : '-'}
                  </td>
                  <td>
                    {score.completedColors > 0
                      ? `${score.completedColors} (+${score.colorBonus})`
                      : '-'}
                  </td>
                  <td className="total-cell">{score.finalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary btn-large" onClick={handleBackToLobby}>
            返回大厅
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
