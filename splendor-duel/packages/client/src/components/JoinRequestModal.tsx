// ============================================================
// 璀璨宝石·对决 - 加入申请审批弹窗
// ============================================================

import React from 'react';
import { useRoomStore } from '../store/roomStore';
import { socketService } from '../services/socketService';

const JoinRequestModal: React.FC = () => {
  const showJoinRequestModal = useRoomStore((s) => s.showJoinRequestModal);
  const incomingJoinRequest = useRoomStore((s) => s.incomingJoinRequest);
  const setIncomingJoinRequest = useRoomStore((s) => s.setIncomingJoinRequest);
  const setShowJoinRequestModal = useRoomStore((s) => s.setShowJoinRequestModal);

  if (!showJoinRequestModal || !incomingJoinRequest) return null;

  const handleRespond = (approved: boolean) => {
    socketService.respondToJoinRequest(incomingJoinRequest.requestId, approved);
    setIncomingJoinRequest(null);
    setShowJoinRequestModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="border-b border-purple-300 p-4">
          <h2 className="text-xl font-bold text-purple-700 text-center">📩 加入申请</h2>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-lg text-gray-700">
              玩家 <span className="font-bold text-purple-700">{incomingJoinRequest.playerName}</span> 申请加入你的房间
            </p>
            <p className="text-sm text-gray-500 mt-2">房间: {incomingJoinRequest.roomId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleRespond(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => handleRespond(true)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
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
