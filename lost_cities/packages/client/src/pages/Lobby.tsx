// ============================================================
// 失落的城市 - 大厅页面
// ============================================================

import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { RulesModal } from '../components/RulesModal';
import { ToastStack } from '../components/ToastStack';

const Lobby: React.FC = () => {
  const connected = useGameStore((s) => s.connected);
  const name = useGameStore((s) => s.name);
  const setName = useGameStore((s) => s.setName);
  const roomCode = useGameStore((s) => s.roomCode);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const invitedRoomCode = useGameStore((s) => s.invitedRoomCode);
  const pendingHost = useGameStore((s) => s.pendingHost);
  const setPendingHost = useGameStore((s) => s.setPendingHost);
  const pendingPort = useGameStore((s) => s.pendingPort);
  const setPendingPort = useGameStore((s) => s.setPendingPort);
  const roundsTotal = useGameStore((s) => s.roundsTotal);
  const setRoundsTotal = useGameStore((s) => s.setRoundsTotal);
  const reconnectCode = useGameStore((s) => s.reconnectCode);
  const reconnectToken = useGameStore((s) => s.reconnectToken);

  const showCreateModal = useGameStore((s) => s.showCreateModal);
  const setShowCreateModal = useGameStore((s) => s.setShowCreateModal);
  const showJoinModal = useGameStore((s) => s.showJoinModal);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);
  const setShowRulesModal = useGameStore((s) => s.setShowRulesModal);

  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const reconnect = useGameStore((s) => s.reconnect);
  const applyServerAddress = useGameStore((s) => s.applyServerAddress);
  const initSocket = useGameStore((s) => s.initSocket);
  const pushToast = useGameStore((s) => s.pushToast);

  // 初始化 socket 连接
  useEffect(() => {
    initSocket();
  }, []);

  // 邀请链接自动弹出加入弹窗
  useEffect(() => {
    if (invitedRoomCode) {
      setShowJoinModal(true);
      setShowCreateModal(false);
      setRoomCode(invitedRoomCode);
      pushToast('这是邀请链接，请设置昵称后加入房间');
    }
  }, []);

  return (
    <div>
      <header>
        <h1>Lost Cities</h1>
        <div className="header-right">
          <div className="badge">{connected ? '已连接' : '未连接'}</div>
        </div>
      </header>

      <ToastStack />
      <RulesModal />

      <main>
        <div className="lobby-shell">
          <div className="lobby-hero">
            <h2>探索失落的文明</h2>
            <p>
              两人对战，五条探险路线。用策略押注与出牌，赢得更高的探险收益。
            </p>
            <button
              className="secondary"
              onClick={() => setShowRulesModal(true)}
            >
              游戏规则
            </button>
          </div>
          <div className="panel lobby-actions">
            <div className="room-card">
              <h3>快速开始</h3>
              <input
                placeholder="昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div
                className="stack"
                style={{ flexDirection: 'row', gap: 12 }}
              >
                <button onClick={() => setShowCreateModal(true)}>
                  创建房间
                </button>
                <button
                  className="secondary"
                  onClick={() => setShowJoinModal(true)}
                >
                  加入房间
                </button>
              </div>
            </div>
            <div className="room-card">
              <h3>服务器地址</h3>
              <div className="stack" style={{ gap: 8 }}>
                <input
                  placeholder={pendingHost}
                  value={pendingHost}
                  onChange={(e) => setPendingHost(e.target.value)}
                />
                <input
                  placeholder="3005"
                  value={pendingPort}
                  onChange={(e) => setPendingPort(e.target.value)}
                />
              </div>
              <button onClick={applyServerAddress}>确认服务器地址</button>
              {reconnectCode && reconnectToken && (
                <button className="secondary" onClick={reconnect}>
                  断线重连
                </button>
              )}
            </div>
          </div>

          {showCreateModal && (
            <div
              className="modal-backdrop"
              onClick={() => setShowCreateModal(false)}
            >
              <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>创建房间</h3>
                <label>
                  昵称
                  <input
                    placeholder="昵称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  局数（0 表示无限）
                  <input
                    placeholder="3"
                    value={roundsTotal}
                    onChange={(e) => setRoundsTotal(e.target.value)}
                  />
                </label>
                <div className="modal-actions">
                  <button onClick={createRoom}>创建</button>
                  <button
                    className="secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {showJoinModal && (
            <div
              className="modal-backdrop"
              onClick={() => setShowJoinModal(false)}
            >
              <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>加入房间</h3>
                {invitedRoomCode && (
                  <div className="notice">
                    邀请房间号：{invitedRoomCode}
                  </div>
                )}
                <label>
                  昵称
                  <input
                    placeholder="昵称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                {!invitedRoomCode && (
                  <label>
                    房间码
                    <input
                      placeholder="输入房间码"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                    />
                  </label>
                )}
                <div className="modal-actions">
                  <button onClick={joinRoom}>加入</button>
                  <button
                    className="secondary"
                    onClick={() => setShowJoinModal(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lobby;
