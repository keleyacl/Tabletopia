// ============================================================
// 斋浦尔 - 大厅页面组件
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { RoomVisibility } from '@jaipur/shared';

const Lobby: React.FC = () => {
  const name = useGameStore((state) => state.name);
  const roomCode = useGameStore((state) => state.roomCode);
  const connected = useGameStore((state) => state.connected);
  const roomState = useGameStore((state) => state.roomState);
  const roomList = useGameStore((state) => state.roomList);
  const roomListLoading = useGameStore((state) => state.roomListLoading);
  const pendingJoinRequest = useGameStore((state) => state.pendingJoinRequest);
  const roomVisibility = useGameStore((state) => state.roomVisibility);

  const setName = useGameStore((state) => state.setName);
  const connect = useGameStore((state) => state.connect);
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const toggleRulesModal = useGameStore((state) => state.toggleRulesModal);
  const fetchRoomList = useGameStore((state) => state.fetchRoomList);
  const sendJoinRequest = useGameStore((state) => state.sendJoinRequest);
  const cancelJoinRequest = useGameStore((state) => state.cancelJoinRequest);
  const setRoomVisibility = useGameStore((state) => state.setRoomVisibility);

  const [inputName, setInputName] = useState(name);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 自动刷新房间列表（每5秒）
  const startAutoRefresh = useCallback(() => {
    // 清除旧的定时器
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setRefreshCountdown(5);
    fetchRoomList();

    // 倒计时
    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 1000);

    // 每5秒刷新
    timerRef.current = setInterval(() => {
      fetchRoomList();
      setRefreshCountdown(5);
    }, 5000);
  }, [fetchRoomList]);

  // 连接后自动开始刷新房间列表
  useEffect(() => {
    if (connected && roomState === 'idle') {
      startAutoRefresh();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [connected, roomState, startAutoRefresh]);

  const handleConnect = () => {
    if (inputName.trim()) {
      setName(inputName.trim());
      connect();
    }
  };

  const handleCreateRoom = () => {
    if (name.trim()) {
      createRoom();
    }
  };

  const handleJoinRoom = () => {
    if (name.trim() && inputRoomCode.trim()) {
      joinRoom(inputRoomCode.trim().toUpperCase());
    }
  };

  const handleManualRefresh = () => {
    startAutoRefresh();
  };

  const handleToggleVisibility = (v: RoomVisibility) => {
    setRoomVisibility(v);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-lg w-full p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-2">
            🎴 斋浦尔
          </h1>
          <p className="text-gray-600">Jaipur - 印度商人交易游戏</p>
        </div>

        {/* 连接状态 */}
        {!connected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你的昵称
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="输入你的昵称"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={!inputName.trim()}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              连接服务器
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 已连接 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-green-700 font-medium">已连接到服务器</span>
              </div>
            </div>

            {/* 等待审批状态 */}
            {pendingJoinRequest && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="font-bold text-yellow-800 mb-1">等待房主审批...</div>
                    <div className="text-sm text-yellow-600">
                      房间: {pendingJoinRequest.roomCode}
                    </div>
                  </div>
                </div>
                <button
                  onClick={cancelJoinRequest}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  取消申请
                </button>
              </div>
            )}

            {roomState === 'idle' && !pendingJoinRequest && (
              <div className="space-y-5">
                {/* 创建房间区域 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    创建房间
                  </label>
                  {/* 公开/私密切换 */}
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => handleToggleVisibility('public')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        roomVisibility === 'public'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🌐 公开房间
                    </button>
                    <button
                      onClick={() => handleToggleVisibility('private')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        roomVisibility === 'private'
                          ? 'bg-[var(--color-primary)] text-white'
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
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
                    <label className="text-sm font-medium text-gray-700">
                      🏠 公开房间列表
                    </label>
                    <button
                      onClick={handleManualRefresh}
                      disabled={roomListLoading}
                      className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:text-gray-400 flex items-center gap-1 transition-colors"
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
                          key={room.roomCode}
                          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-[var(--color-primary)] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 truncate">
                                {room.hostName}
                              </span>
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
                              {room.playerCount}/{room.maxPlayers} 人 · {room.roomCode}
                            </div>
                          </div>
                          <button
                            onClick={() => sendJoinRequest(room.roomCode)}
                            disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                            className={`ml-3 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                              room.status === 'waiting' && room.playerCount < room.maxPlayers
                                ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white'
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

                {/* 通过房间码加入（私密房间） */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="输入房间码"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] uppercase"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!inputRoomCode.trim()}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    加入
                  </button>
                </div>
              </div>
            )}

            {roomState === 'waiting' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-bold text-blue-800 mb-1">房间: {roomCode}</div>
                    <div className="text-sm text-blue-600">
                      等待对手加入...
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  分享房间码给朋友: <span className="font-bold">{roomCode}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 规则按钮 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={toggleRulesModal}
            className="w-full text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium py-2 transition-colors"
          >
            📖 查看游戏规则
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
