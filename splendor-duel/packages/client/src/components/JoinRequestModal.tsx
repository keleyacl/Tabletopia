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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05030d]/84 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#151224]/95 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.46)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_28%)]" />

        <div className="relative space-y-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">Join Request</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">加入申请</h2>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-4xl">👤</div>
            <p className="mt-4 text-base leading-8 text-white">
              玩家 <span className="font-semibold text-fuchsia-200">{incomingJoinRequest.playerName}</span> 申请加入你的房间
            </p>
            <p className="mt-2 text-sm text-[#a69bbe]">房间码 {incomingJoinRequest.roomId}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleRespond(false)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/88 transition hover:border-white/20 hover:bg-white/[0.1]"
            >
              拒绝
            </button>
            <button
              onClick={() => handleRespond(true)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
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
