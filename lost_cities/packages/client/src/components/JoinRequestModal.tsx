// ============================================================
// 失落的城市 - 加入申请审批弹窗
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const JoinRequestModal: React.FC = () => {
  const showJoinRequestModal = useGameStore((s) => s.showJoinRequestModal);
  const incomingJoinRequest = useGameStore((s) => s.incomingJoinRequest);
  const respondToJoinRequest = useGameStore((s) => s.respondToJoinRequest);

  if (!showJoinRequestModal || !incomingJoinRequest) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>加入申请</h3>
        <p>
          玩家 <strong>{incomingJoinRequest.playerName}</strong> 申请加入你的房间
        </p>
        <div className="modal-actions">
          <button
            onClick={() =>
              respondToJoinRequest(incomingJoinRequest.requestId, true)
            }
          >
            同意
          </button>
          <button
            className="secondary"
            onClick={() =>
              respondToJoinRequest(incomingJoinRequest.requestId, false)
            }
          >
            拒绝
          </button>
        </div>
      </div>
    </div>
  );
};
