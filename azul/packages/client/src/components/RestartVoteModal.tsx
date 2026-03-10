
import React from 'react';
import { RestartVoteInfo } from '@azul/shared';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import { useRoomStore } from '../store/roomStore';

// ============================================================
// 重新开始投票弹窗
// ============================================================

const RestartVoteModal: React.FC = () => {
  const restartVote = useGameStore((s) => s.restartVote);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const roomInfo = useRoomStore((s) => s.roomInfo);

  if (!restartVote || !roomInfo) return null;

  const isRequester = restartVote.requestedBy === myPlayerId;
  const hasVoted = restartVote.votedPlayers.includes(myPlayerId);

  const handleAgree = () => {
    socketService.voteRestart(roomInfo.roomId, myPlayerId, true);
  };

  const handleReject = () => {
    socketService.voteRestart(roomInfo.roomId, myPlayerId, false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content restart-vote-modal">
        <h3 className="modal-title">重新开始投票</h3>

        <div className="restart-vote-info">
          <div className="restart-vote-requester">
            {restartVote.requestedByName} 发起了重新开始
          </div>

          <div className="restart-vote-progress">
            <div className="restart-vote-progress-text">
              已同意 {restartVote.votedPlayers.length}/{restartVote.totalPlayers}
            </div>
            <div className="restart-vote-progress-bar">
              <div
                className="restart-vote-progress-fill"
                style={{
                  width: `${(restartVote.votedPlayers.length / restartVote.totalPlayers) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="restart-vote-players">
            {roomInfo.players.map((player) => {
              const voted = restartVote.votedPlayers.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`restart-vote-player ${voted ? 'voted' : 'pending'}`}
                >
                  <span className="restart-vote-player-name">{player.name}</span>
                  <span className="restart-vote-player-status">
                    {voted ? '✓ 已同意' : '等待中...'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {!isRequester && !hasVoted && (
          <div className="modal-actions restart-vote-actions">
            <button className="btn btn-primary" onClick={handleAgree}>
              同意
            </button>
            <button className="btn btn-secondary" onClick={handleReject}>
              拒绝
            </button>
          </div>
        )}

        {(isRequester || hasVoted) && (
          <div className="restart-vote-waiting">
            等待其他玩家投票...
          </div>
        )}
      </div>
    </div>
  );
};

export default RestartVoteModal;
