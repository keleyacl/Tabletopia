import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';
import { JoinRequestModal } from '../components/JoinRequestModal';
import type { RoomVisibility } from '@azul/shared';
import '../styles/components.css';

const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    roomInfo,
    myPlayerId,
    isHost,
    isConnected,
    isLoading,
    errorMessage,
    roomList,
    roomListLoading,
    pendingJoinRequest,
    roomVisibility,
    setRoomInfo,
    setLoading,
    setError,
    setPlayerName: storeSetPlayerName,
    setRoomList,
    setRoomListLoading,
    setPendingJoinRequest,
    setIncomingJoinRequest,
    setShowJoinRequestModal,
    setRoomVisibility,
  } = useRoomStore();

  const { setMyPlayerId } = useGameStore();

  // 自动刷新房间列表
  const startAutoRefresh = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setRefreshCountdown(5);
    setRoomListLoading(true);
    socketService.fetchRoomList();

    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setInterval(() => {
      socketService.fetchRoomList();
      setRefreshCountdown(5);
    }, 5000);
  }, [setRoomListLoading]);

  // 注册大厅事件监听
  useEffect(() => {
    const handleRoomList = (data: { rooms: any[] }) => {
      setRoomList(data.rooms);
    };
    const handleJoinRequestReceived = (data: any) => {
      setIncomingJoinRequest(data);
      setShowJoinRequestModal(true);
    };
    const handleJoinApproved = (data: any) => {
      setRoomInfo(data.roomInfo, data.playerId);
      setMyPlayerId(data.playerId);
      setPendingJoinRequest(null);
    };
    const handleJoinRejected = (_data: any) => {
      setPendingJoinRequest(null);
      setError('房主拒绝了你的加入申请');
    };
    const handleRequestCancelled = () => {
      setIncomingJoinRequest(null);
      setShowJoinRequestModal(false);
    };

    socketService.on('lobby:room_list', handleRoomList);
    socketService.on('lobby:join_request_received', handleJoinRequestReceived);
    socketService.on('lobby:join_approved', handleJoinApproved);
    socketService.on('lobby:join_rejected', handleJoinRejected);
    socketService.on('lobby:request_cancelled', handleRequestCancelled);

    return () => {
      socketService.off('lobby:room_list', handleRoomList);
      socketService.off('lobby:join_request_received', handleJoinRequestReceived);
      socketService.off('lobby:join_approved', handleJoinApproved);
      socketService.off('lobby:join_rejected', handleJoinRejected);
      socketService.off('lobby:request_cancelled', handleRequestCancelled);
    };
  }, [setRoomList, setIncomingJoinRequest, setShowJoinRequestModal, setRoomInfo, setMyPlayerId, setPendingJoinRequest, setError]);

  // 连接后且未在房间中时自动刷新
  useEffect(() => {
    if (isConnected && !roomInfo && !pendingJoinRequest) {
      startAutoRefresh();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isConnected, roomInfo, pendingJoinRequest, startAutoRefresh]);

  // 创建房间
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('请输入你的名称');
      return;
    }

    setLoading(true);
    const result = await socketService.createRoom(playerName.trim(), roomVisibility);

    if (result.success && result.roomInfo && result.playerId) {
      setRoomInfo(result.roomInfo, result.playerId);
      setMyPlayerId(result.playerId);
      storeSetPlayerName(playerName.trim());
    } else {
      setError(result.error || '创建房间失败');
    }
  };

  // 加入房间
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('请输入你的名称');
      return;
    }
    if (!roomIdInput.trim()) {
      setError('请输入房间号');
      return;
    }

    setLoading(true);
    const result = await socketService.joinRoom(
      roomIdInput.trim().toUpperCase(),
      playerName.trim()
    );

    if (result.success && result.roomInfo && result.playerId) {
      setRoomInfo(result.roomInfo, result.playerId);
      setMyPlayerId(result.playerId);
      storeSetPlayerName(playerName.trim());
    } else {
      setError(result.error || '加入房间失败');
    }
  };

  // 开始游戏
  const handleStartGame = () => {
    if (!roomInfo) return;
    socketService.startGame(roomInfo.roomId, myPlayerId);
  };

  // 离开房间
  const handleLeaveRoom = () => {
    if (roomInfo) {
      socketService.leaveRoom(roomInfo.roomId, myPlayerId);
    }
    useRoomStore.getState().resetRoom();
    setMode('menu');
  };

  // 申请加入公开房间
  const handleSendJoinRequest = (roomId: string) => {
    if (!playerName.trim()) {
      setError('请先输入你的名称');
      return;
    }
    socketService.sendJoinRequest(roomId, playerName.trim());
    setPendingJoinRequest({ roomId, status: 'pending' });
  };

  // 取消加入申请
  const handleCancelJoinRequest = () => {
    if (pendingJoinRequest) {
      socketService.cancelJoinRequest(pendingJoinRequest.roomId);
      setPendingJoinRequest(null);
    }
  };

  // 手动刷新
  const handleManualRefresh = () => {
    startAutoRefresh();
  };

  // 连接状态提示
  if (!isConnected) {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1 className="lobby-title">花砖物语</h1>
          <h2 className="lobby-subtitle">Azul</h2>
          <div className="lobby-connecting">正在连接服务器...</div>
        </div>
      </div>
    );
  }

  // 已在房间中 - 显示等待界面
  if (roomInfo) {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1 className="lobby-title">花砖物语</h1>
          <h2 className="lobby-subtitle">Azul</h2>

          <div className="room-info">
            <div className="room-id">
              房间号: <span className="room-id-value">{roomInfo.roomId}</span>
            </div>

            <div className="player-list">
              <h3>玩家列表 ({roomInfo.players.length}/4)</h3>
              {roomInfo.players.map((player) => (
                <div
                  key={player.id}
                  className={`player-item ${
                    player.id === roomInfo.hostId ? 'host' : ''
                  } ${player.id === myPlayerId ? 'me' : ''}`}
                >
                  <span className="player-name">{player.name}</span>
                  {player.id === roomInfo.hostId && (
                    <span className="host-badge">房主</span>
                  )}
                  {player.id === myPlayerId && (
                    <span className="me-badge">我</span>
                  )}
                </div>
              ))}
            </div>

            {roomInfo.players.length < 2 && (
              <div className="waiting-hint">等待更多玩家加入...</div>
            )}

            <div className="room-actions">
              {isHost && roomInfo.players.length >= 2 && (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleStartGame}
                >
                  开始游戏
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleLeaveRoom}
              >
                离开房间
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
        </div>
        <JoinRequestModal />
      </div>
    );
  }

  // 主菜单
  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">花砖物语</h1>
        <h2 className="lobby-subtitle">Azul</h2>

        {/* 等待审批状态 */}
        {pendingJoinRequest && (
          <div className="form-section">
            <div className="waiting-hint">⏳ 等待房主审批...</div>
            <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#666', marginBottom: '12px' }}>
              房间: {pendingJoinRequest.roomId}
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleCancelJoinRequest}
            >
              取消申请
            </button>
          </div>
        )}

        {!pendingJoinRequest && mode === 'menu' && (
          <div className="form-section">
            <input
              type="text"
              className="input-field"
              placeholder="输入你的名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />

            {/* 房间可见性切换 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                className={`btn ${roomVisibility === 'public' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRoomVisibility('public')}
              >
                🌐 公开房间
              </button>
              <button
                className={`btn ${roomVisibility === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRoomVisibility('private')}
              >
                🔒 私密房间
              </button>
            </div>
            <div style={{ fontSize: '0.8em', color: '#888', marginBottom: '12px' }}>
              {roomVisibility === 'public'
                ? '公开房间会显示在大厅列表中，其他玩家可以申请加入'
                : '私密房间不会显示在列表中，只能通过房间码加入'}
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
              disabled={isLoading || !playerName.trim()}
            >
              {isLoading ? '创建中...' : '创建房间'}
            </button>

            <div style={{ textAlign: 'center', color: '#aaa', margin: '16px 0', fontSize: '0.9em' }}>── 或通过房间码加入 ──</div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="输入房间号"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleJoinRoom}
                disabled={isLoading || !roomIdInput.trim() || !playerName.trim()}
              >
                加入
              </button>
            </div>

            {/* 公开房间列表 */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1em' }}>🏠 公开房间列表</h3>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '0.8em' }}
                  onClick={handleManualRefresh}
                  disabled={roomListLoading}
                >
                  {roomListLoading ? '刷新中...' : `🔄 刷新 (${refreshCountdown}s)`}
                </button>
              </div>

              {roomList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f5f5f5', borderRadius: '8px', color: '#999' }}>
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>🏜️</div>
                  <div>暂无公开房间</div>
                  <div style={{ fontSize: '0.8em', marginTop: '4px' }}>创建一个房间或等待其他玩家创建</div>
                </div>
              ) : (
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {roomList.map((room) => (
                    <div
                      key={room.roomId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        marginBottom: '6px',
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {room.hostName}
                          <span
                            style={{
                              fontSize: '0.75em',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              marginLeft: '8px',
                              background: room.status === 'waiting' ? '#e8f5e9' : '#fff3e0',
                              color: room.status === 'waiting' ? '#2e7d32' : '#e65100',
                            }}
                          >
                            {room.status === 'waiting' ? '等待中' : '游戏中'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '2px' }}>
                          {room.playerCount}/{room.maxPlayers} 人 · {room.roomId}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 16px', fontSize: '0.85em' }}
                        onClick={() => handleSendJoinRequest(room.roomId)}
                        disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                      >
                        {room.status === 'waiting' ? '申请加入' : '游戏中'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
      </div>
      <JoinRequestModal />
    </div>
  );
};

export default Lobby;
