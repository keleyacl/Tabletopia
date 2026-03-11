// ============================================================
// 斋浦尔 - 加入申请审批弹窗组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const JoinRequestModal: React.FC = () => {
  const showJoinRequestModal = useGameStore((state) => state.showJoinRequestModal);
  const incomingJoinRequest = useGameStore((state) => state.incomingJoinRequest);
  const respondToJoinRequest = useGameStore((state) => state.respondToJoinRequest);

  if (!showJoinRequestModal || !incomingJoinRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="border-b border-[var(--color-primary)] p-4">
          <h2 className="text-xl font-bold text-[var(--color-primary)] text-center">
            📩 加入申请
          </h2>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-lg text-gray-700">
              玩家 <span className="font-bold text-[var(--color-primary)]">{incomingJoinRequest.playerName}</span> 申请加入你的房间
            </p>
            <p className="text-sm text-gray-500 mt-2">
              房间: {incomingJoinRequest.roomCode}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => respondToJoinRequest(incomingJoinRequest.requestId, false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => respondToJoinRequest(incomingJoinRequest.requestId, true)}
              className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              同意
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestModal;
