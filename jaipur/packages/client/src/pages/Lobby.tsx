// ============================================================
// 斋浦尔 - 大厅页面组件
// ============================================================

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const Lobby: React.FC = () => {
  const name = useGameStore((state) => state.name);
  const roomCode = useGameStore((state) => state.roomCode);
  const connected = useGameStore((state) => state.connected);
  const roomState = useGameStore((state) => state.roomState);
  
  const setName = useGameStore((state) => state.setName);
  const connect = useGameStore((state) => state.connect);
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const toggleRulesModal = useGameStore((state) => state.toggleRulesModal);

  const [inputName, setInputName] = useState(name);
  const [inputRoomCode, setInputRoomCode] = useState('');

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

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-md w-full p-8">
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

            {roomState === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    创建或加入房间
                  </label>
                  <div className="space-y-3">
                    <button
                      onClick={handleCreateRoom}
                      className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      创建新房间
                    </button>
                    <div className="text-center text-gray-500">或</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputRoomCode}
                        onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                        placeholder="房间码"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] uppercase"
                        maxLength={6}
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
