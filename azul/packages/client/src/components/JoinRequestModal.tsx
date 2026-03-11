import React from 'react';
import { useRoomStore } from '../store/roomStore';
import { socketService } from '../services/socketService';

export const JoinRequestModal: React.FC = () => {
  const showJoinRequestModal = useRoomStore((state) => state.showJoinRequestModal);
  const incomingJoinRequest = useRoomStore((state) => state.incomingJoinRequest);
  const setIncomingJoinRequest = useRoomStore((state) => state.setIncomingJoinRequest);
  const setShowJoinRequestModal = useRoomStore((state) => state.setShowJoinRequestModal);

  if (!showJoinRequestModal || !incomingJoinRequest) return null;

  const handleRespond = (approved: boolean) => {
    socketService.respondToJoinRequest(incomingJoinRequest.requestId, approved);
    setIncomingJoinRequest(null);
    setShowJoinRequestModal(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '360px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ textAlign: 'center', marginTop: 0 }}>📩 加入申请</h3>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div style={{ fontSize: '2.5em', marginBottom: '8px' }}>👤</div>
          <p>
            玩家 <strong>{incomingJoinRequest.playerName}</strong> 申请加入你的房间
          </p>
          <p style={{ fontSize: '0.85em', color: '#888' }}>
            房间: {incomingJoinRequest.roomId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => handleRespond(false)}
          >
            拒绝
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => handleRespond(true)}
          >
            同意
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestModal;
