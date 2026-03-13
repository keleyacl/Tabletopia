// ============================================================
// 璀璨宝石·对决 - 大厅页面
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socketService';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';
import JoinRequestModal from '../components/JoinRequestModal';
import type { RoomVisibility } from '@splendor/shared';
import '../styles/lobby.css';

const Lobby: React.FC = () => {
  const navigate = useNavigate();

  const connectionStatus = useRoomStore((s) => s.connectionStatus);
  const roomId = useRoomStore((s) => s.roomId);
  const playerId = useRoomStore((s) => s.playerId);
  const error = useRoomStore((s) => s.error);
  const playerName = useRoomStore((s) => s.playerName);
  const isHost = useRoomStore((s) => s.isHost);
  const roomInfo = useRoomStore((s) => s.roomInfo);
  const roomList = useRoomStore((s) => s.roomList);
  const roomListLoading = useRoomStore((s) => s.roomListLoading);
  const pendingJoinRequest = useRoomStore((s) => s.pendingJoinRequest);
  const roomVisibility = useRoomStore((s) => s.roomVisibility);

  const setRoom = useRoomStore((s) => s.setRoom);
  const setConnectionStatus = useRoomStore((s) => s.setConnectionStatus);
  const setError = useRoomStore((s) => s.setError);
  const setPlayerName = useRoomStore((s) => s.setPlayerName);
  const setIsHost = useRoomStore((s) => s.setIsHost);
  const setRoomInfo = useRoomStore((s) => s.setRoomInfo);
  const setRoomList = useRoomStore((s) => s.setRoomList);
  const setRoomListLoading = useRoomStore((s) => s.setRoomListLoading);
  const setPendingJoinRequest = useRoomStore((s) => s.setPendingJoinRequest);
  const setIncomingJoinRequest = useRoomStore((s) => s.setIncomingJoinRequest);
  const setShowJoinRequestModal = useRoomStore((s) => s.setShowJoinRequestModal);
  const setRoomVisibility = useRoomStore((s) => s.setRoomVisibility);
  const reconnectToken = useRoomStore((s) => s.reconnectToken);
  const setReconnectToken = useRoomStore((s) => s.setReconnectToken);

  const setGameState = useGameStore((s) => s.setGameState);

  const [inputName, setInputName] = useState(playerName);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);



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

  // 连接服务器
  const handleConnect = () => {
    if (!inputName.trim()) return;
    setPlayerName(inputName.trim());
    setConnectionStatus('connecting');
    socketService.connect();
  };

  // 注册事件监听
  useEffect(() => {
    const unsubConnect = socketService.on('_internal_connect', () => {
      setConnectionStatus('connected');

      // 自动重连：如果有 reconnectToken，说明之前在游戏中断线，自动尝试重连
      const currentToken = useRoomStore.getState().reconnectToken;
      if (currentToken) {
        console.log('[Lobby] 检测到 reconnectToken，自动尝试重连...');
        socketService.reconnect(currentToken);
      }
    });
    const unsubDisconnect = socketService.on('_internal_disconnect', () => {
      setConnectionStatus('disconnected');
    });
    const unsubError = socketService.on('_internal_error', (msg: string) => {
      setError(msg);
      setConnectionStatus('disconnected');
    });

    const unsubRoomCreated = socketService.on('room:created', (data: any) => {
      setRoom(data.roomId, data.playerId);
      setIsHost(true);
      if (data.roomInfo) setRoomInfo(data.roomInfo);
      if (data.reconnectToken) setReconnectToken(data.reconnectToken);
    });

    const unsubRoomJoined = socketService.on('room:joined', (data: any) => {
      setRoom(data.roomId, data.playerId);
      setIsHost(false);
      if (data.reconnectToken) setReconnectToken(data.reconnectToken);
    });

    const unsubRoomError = socketService.on('room:error', (data: any) => {
      setError(data.error || data.message || '操作失败');
    });

    const unsubGameStarted = socketService.on('room:game_started', (state: any) => {
      setGameState(state);
      navigate('/game');
    });

    const unsubRoomList = socketService.on('lobby:room_list', (data: any) => {
      setRoomList(data.rooms);
    });

    const unsubJoinRequestReceived = socketService.on('lobby:join_request_received', (data: any) => {
      setIncomingJoinRequest(data);
      setShowJoinRequestModal(true);
    });

    const unsubJoinApproved = socketService.on('lobby:join_approved', (data: any) => {
      setRoom(data.roomId, data.playerId);
      setIsHost(false);
      if (data.roomInfo) setRoomInfo(data.roomInfo);
      if (data.reconnectToken) setReconnectToken(data.reconnectToken);
      setPendingJoinRequest(null);
    });

    const unsubJoinRejected = socketService.on('lobby:join_rejected', () => {
      setPendingJoinRequest(null);
      setError('房主拒绝了你的加入申请');
    });

    const unsubRequestCancelled = socketService.on('lobby:request_cancelled', () => {
      setIncomingJoinRequest(null);
      setShowJoinRequestModal(false);
    });

    const unsubPlayerJoined = socketService.on('room:player_joined', () => {
      // 对手加入
    });

    const unsubStateUpdate = socketService.on('game:state_update', (state: any) => {
      setGameState(state);
      navigate('/game');
    });

    // 断线/重连事件
    const unsubPlayerDisconnected = socketService.on('game:playerDisconnected', (data: any) => {
      setError(`${data.playerName} 已断线`);
    });

    const unsubPlayerReconnected = socketService.on('game:playerReconnected', (data: any) => {
      setError(`${data.playerName} 已重连`);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
      unsubRoomCreated();
      unsubRoomJoined();
      unsubRoomError();
      unsubGameStarted();
      unsubRoomList();
      unsubJoinRequestReceived();
      unsubJoinApproved();
      unsubJoinRejected();
      unsubRequestCancelled();
      unsubPlayerJoined();
      unsubStateUpdate();
      unsubPlayerDisconnected();
      unsubPlayerReconnected();
    };
  }, [
    setConnectionStatus,
    setError,
    setRoom,
    setIsHost,
    setRoomInfo,
    setRoomList,
    setIncomingJoinRequest,
    setShowJoinRequestModal,
    setPendingJoinRequest,
    setGameState,
    navigate,
    setRoomListLoading,
  ]);

  // 连接后自动刷新
  useEffect(() => {
    if (connectionStatus === 'connected' && !roomId && !pendingJoinRequest) {
      startAutoRefresh();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [connectionStatus, roomId, pendingJoinRequest, startAutoRefresh]);

  const handleCreateRoom = () => {
    socketService.createRoom(playerName, roomVisibility);
  };

  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) return;
    socketService.joinRoom(inputRoomCode.trim().toUpperCase(), playerName);
  };

  const handleSendJoinRequest = (targetRoomId: string) => {
    socketService.sendJoinRequest(targetRoomId, playerName);
    setPendingJoinRequest({ roomId: targetRoomId, status: 'pending' });
  };

  const handleCancelJoinRequest = () => {
    if (pendingJoinRequest) {
      socketService.cancelJoinRequest(pendingJoinRequest.roomId);
      setPendingJoinRequest(null);
    }
  };

  const handleManualRefresh = () => {
    startAutoRefresh();
  };

  // 未连接状态
  if (connectionStatus !== 'connected') {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1 className="lobby-title">璀璨宝石·对决</h1>
          <h2 className="lobby-subtitle">Splendor Duel</h2>

          <div className="form-section">
            <input
              type="text"
              className="input-field"
              placeholder="输入你的名称"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              className="btn btn-primary btn-large"
              onClick={handleConnect}
              disabled={!inputName.trim() || connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? '正在连接服务器...' : '连接服务器'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
        <JoinRequestModal />
      </div>
    );
  }

  // 已在房间中 - 显示等待界面
  if (roomId) {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1 className="lobby-title">璀璨宝石·对决</h1>
          <h2 className="lobby-subtitle">Splendor Duel</h2>

          <div className="room-info">
            <div className="room-id">
              房间号: <span className="room-id-value">{roomId}</span>
            </div>

            <div className="player-list">
              <h3>玩家列表 ({roomInfo ? roomInfo.players.length : 1}/2)</h3>
              {roomInfo?.players.map((player) => (
                <div
                  key={player.id}
                  className={`player-item ${player.id === roomInfo.hostId ? 'host' : ''} ${player.id === playerId ? 'me' : ''}`}
                >
                  <span className="player-name">{player.name}</span>
                  {player.id === roomInfo.hostId && <span className="host-badge">房主</span>}
                  {player.id === playerId && <span className="me-badge">我</span>}
                </div>
              ))}
            </div>

            {roomInfo && roomInfo.players.length < 2 && (
              <div className="waiting-hint">等待对手加入...</div>
            )}

            <div className="room-actions">
              {isHost && roomInfo && roomInfo.players.length >= 2 && (
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => socketService.startGame(roomId!, playerId!)}
                >
                  开始游戏
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (roomId) socketService.leaveRoom(roomId, playerId!);
                  useRoomStore.getState().reset();
                }}
              >
                离开房间
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
        <JoinRequestModal />
      </div>
    );
  }

  // 主菜单
  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">璀璨宝石·对决</h1>
        <h2 className="lobby-subtitle">Splendor Duel</h2>

        {/* 等待审批状态 */}
        {pendingJoinRequest && (
          <div className="form-section">
            <div className="waiting-hint">⏳ 等待房主审批...</div>
            <div style={{ textAlign: 'center', fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              房间: {pendingJoinRequest.roomId}
            </div>
            <button className="btn btn-secondary" onClick={handleCancelJoinRequest}>
              取消申请
            </button>
          </div>
        )}

        {!pendingJoinRequest && (
          <div className="form-section">
            {/* 房间可见性切换 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
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
            <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {roomVisibility === 'public'
                ? '公开房间会显示在大厅列表中，其他玩家可以申请加入'
                : '私密房间不会显示在列表中，只能通过房间码加入'}
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
              disabled={!playerName.trim()}
            >
              创建房间
            </button>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '4px 0', fontSize: '0.9em' }}>
              ── 或通过房间码加入 ──
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="输入房间号"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{ flex: 1, marginBottom: 0 }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                className="btn btn-primary"
                onClick={handleJoinRoom}
                disabled={!inputRoomCode.trim()}
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
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
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
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
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
                              background: room.status === 'waiting' ? 'rgba(102,187,106,0.15)' : 'rgba(245,158,11,0.15)',
                              color: room.status === 'waiting' ? 'var(--text-success)' : 'var(--text-warning)',
                            }}
                          >
                            {room.status === 'waiting' ? '等待中' : '游戏中'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginTop: '2px' }}>
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

        {error && <div className="error-message">{error}</div>}
      </div>
      <JoinRequestModal />
    </div>
  );
};

export default Lobby;
