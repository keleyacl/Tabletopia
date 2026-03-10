import React, { useState } from 'react';
import { socketService } from '../services/socketService';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';
import '../styles/components.css';

const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const {
    roomInfo,
    myPlayerId,
    isHost,
    isConnected,
    isLoading,
    errorMessage,
    setRoomInfo,
    setLoading,
    setError,
    setPlayerName: storeSetPlayerName,
  } = useRoomStore();

  const { setMyPlayerId } = useGameStore();

  // 创建房间
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('请输入你的名称');
      return;
    }

    setLoading(true);
    const result = await socketService.createRoom(playerName.trim());

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
      </div>
    );
  }

  // 主菜单
  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">花砖物语</h1>
        <h2 className="lobby-subtitle">Azul</h2>

        {mode === 'menu' && (
          <div className="menu-buttons">
            <button
              className="btn btn-primary btn-large"
              onClick={() => setMode('create')}
            >
              创建房间
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => setMode('join')}
            >
              加入房间
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="form-section">
            <input
              type="text"
              className="input-field"
              placeholder="输入你的名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
              autoFocus
            />
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? '创建中...' : '创建房间'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMode('menu')}
              >
                返回
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="form-section">
            <input
              type="text"
              className="input-field"
              placeholder="输入你的名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
              autoFocus
            />
            <input
              type="text"
              className="input-field"
              placeholder="输入房间号"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleJoinRoom}
                disabled={isLoading}
              >
                {isLoading ? '加入中...' : '加入房间'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMode('menu')}
              >
                返回
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
