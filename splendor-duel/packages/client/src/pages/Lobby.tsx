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
    });

    const unsubRoomJoined = socketService.on('room:joined', (data: any) => {
      setRoom(data.roomId, data.playerId);
      setIsHost(false);
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
    };
  }, [setConnectionStatus, setError, setRoom, setIsHost, setRoomInfo, setRoomList, setIncomingJoinRequest, setShowJoinRequestModal, setPendingJoinRequest, setGameState, navigate, setRoomListLoading]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl max-w-lg w-full p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-700 mb-2">💎 璀璨宝石·对决</h1>
          <p className="text-gray-500">Splendor Duel</p>
        </div>

        {/* 未连接 */}
        {connectionStatus !== 'connected' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">你的昵称</label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="输入你的昵称"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={!inputName.trim() || connectionStatus === 'connecting'}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {connectionStatus === 'connecting' ? '连接中...' : '连接服务器'}
            </button>
          </div>
        ) : roomId ? (
          /* 已在房间中 */
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-bold text-purple-800 mb-1">房间: {roomId}</div>
              <div className="text-sm text-purple-600">
                {roomInfo ? `${roomInfo.players.length}/2 人` : ''} · 等待对手加入...
              </div>
            </div>
            <div className="text-center text-sm text-gray-500">
              分享房间码给朋友: <span className="font-bold">{roomId}</span>
            </div>
          </div>
        ) : (
          /* 大厅 */
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-green-700 font-medium">已连接到服务器</span>
              </div>
            </div>

            {/* 等待审批 */}
            {pendingJoinRequest ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="font-bold text-yellow-800 mb-1">等待房主审批...</div>
                  <div className="text-sm text-yellow-600">房间: {pendingJoinRequest.roomId}</div>
                </div>
                <button
                  onClick={handleCancelJoinRequest}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  取消申请
                </button>
              </div>
            ) : (
              <>
                {/* 创建房间 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">创建房间</label>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setRoomVisibility('public')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        roomVisibility === 'public'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🌐 公开房间
                    </button>
                    <button
                      onClick={() => setRoomVisibility('private')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        roomVisibility === 'private'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🔒 私密房间
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {roomVisibility === 'public'
                      ? '公开房间会显示在大厅列表中，其他玩家可以申请加入'
                      : '私密房间不会显示在列表中，只能通过房间码加入'}
                  </p>
                  <button
                    onClick={handleCreateRoom}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    创建新房间
                  </button>
                </div>

                {/* 分隔线 */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="text-gray-400 text-sm">或</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* 公开房间列表 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🏠 公开房间列表</label>
                    <button
                      onClick={handleManualRefresh}
                      disabled={roomListLoading}
                      className="text-xs text-purple-600 hover:text-purple-700 disabled:text-gray-400 flex items-center gap-1 transition-colors"
                    >
                      {roomListLoading ? '刷新中...' : `🔄 刷新 (${refreshCountdown}s)`}
                    </button>
                  </div>

                  {roomList.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <div className="text-2xl mb-2">🏜️</div>
                      <p className="text-gray-500 text-sm">暂无公开房间</p>
                      <p className="text-gray-400 text-xs mt-1">创建一个房间或等待其他玩家创建</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {roomList.map((room) => (
                        <div
                          key={room.roomId}
                          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-purple-400 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 truncate">{room.hostName}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  room.status === 'waiting'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {room.status === 'waiting' ? '等待中' : '游戏中'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {room.playerCount}/{room.maxPlayers} 人 · {room.roomId}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendJoinRequest(room.roomId)}
                            disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                            className={`ml-3 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                              room.status === 'waiting' && room.playerCount < room.maxPlayers
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {room.status === 'waiting' ? '申请加入' : '游戏中'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 分隔线 */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="text-gray-400 text-sm">或通过房间码加入</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* 房间码加入 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="输入房间码"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    maxLength={8}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!inputRoomCode.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    加入
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
      </div>
      <JoinRequestModal />
    </div>
  );
};

export default Lobby;
