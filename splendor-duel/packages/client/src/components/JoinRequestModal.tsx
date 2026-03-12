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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05030d]/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#120d22]/92 shadow-2xl shadow-black/60">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/14 via-transparent to-cyan-400/10" />

        <div className="relative border-b border-white/10 px-6 py-5">
          <div className="text-sm uppercase tracking-[0.32em] text-white/45">Join Request</div>
          <h2 className="mt-2 text-2xl font-bold text-white">📩 加入申请</h2>
        </div>

        <div className="relative space-y-6 px-6 py-6">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-4xl">👤</div>
            <p className="mt-3 text-lg leading-8 text-white">
              玩家 <span className="font-bold text-fuchsia-200">{incomingJoinRequest.playerName}</span> 申请加入你的房间
            </p>
            <p className="mt-2 text-sm text-[#a69bbe]">房间码 {incomingJoinRequest.roomId}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleRespond(false)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 font-semibold text-white/85 transition hover:border-white/20 hover:bg-white/10"
            >
              拒绝
            </button>
            <button
              onClick={() => handleRespond(true)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition hover:scale-[1.01] hover:brightness-110"
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
