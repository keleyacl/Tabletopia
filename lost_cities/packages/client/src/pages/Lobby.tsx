// ============================================================
// 失落的城市 - 大厅页面
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

  const roomList = useGameStore((s) => s.roomList);
  const roomListLoading = useGameStore((s) => s.roomListLoading);
  const pendingJoinRequest = useGameStore((s) => s.pendingJoinRequest);
  const visibility = useGameStore((s) => s.visibility);
  const setVisibility = useGameStore((s) => s.setVisibility);
  const fetchRoomList = useGameStore((s) => s.fetchRoomList);
  const sendJoinRequest = useGameStore((s) => s.sendJoinRequest);
  const cancelJoinRequest = useGameStore((s) => s.cancelJoinRequest);

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

  // 自动刷新房间列表
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoRefresh = useCallback(() => {
    // 清理旧的定时器
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setRefreshCountdown(5);
    if (connected) {
      fetchRoomList();
    }

    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    timerRef.current = setInterval(() => {
      if (connected) {
        fetchRoomList();
      }
      setRefreshCountdown(5);
    }, 5000);
  }, [connected, fetchRoomList]);

  useEffect(() => {
    startAutoRefresh();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoRefresh]);

  const handleManualRefresh = useCallback(() => {
    if (connected) {
      fetchRoomList();
    }
    // 重置倒计时
    setRefreshCountdown(5);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    startAutoRefresh();
  }, [connected, fetchRoomList, startAutoRefresh]);

  const handleSendJoinRequest = useCallback(
    (roomCode: string) => {
      if (!name.trim()) {
        pushToast('请先输入昵称');
        return;
      }
      sendJoinRequest(roomCode);
    },
    [name, sendJoinRequest, pushToast]
  );

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

          <div className="panel" style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>公开房间</h3>
              <button
                className="secondary"
                onClick={handleManualRefresh}
                style={{ fontSize: 13, padding: '4px 12px' }}
              >
                刷新 ({refreshCountdown}s)
              </button>
            </div>
            {roomListLoading && roomList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>加载中...</p>
            ) : roomList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>
                暂无公开房间
              </p>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {roomList.map((room) => {
                  const isPending =
                    pendingJoinRequest?.roomCode === room.roomCode &&
                    pendingJoinRequest?.status === 'pending';
                  const isRejected =
                    pendingJoinRequest?.roomCode === room.roomCode &&
                    pendingJoinRequest?.status === 'rejected';
                  const isFull =
                    room.status === 'playing' ||
                    room.playerCount >= room.maxPlayers;

                  return (
                    <div
                      key={room.roomCode}
                      className="room-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                      }}
                    >
                      <div>
                        <strong>{room.hostName}</strong>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 13,
                            color: room.status === 'waiting' ? '#4caf50' : '#ff9800',
                          }}
                        >
                          {room.status === 'waiting' ? '等待中' : '游戏中'}
                        </span>
                        <span
                          style={{ marginLeft: 8, fontSize: 13, color: '#999' }}
                        >
                          {room.playerCount}/{room.maxPlayers} 人
                        </span>
                      </div>
                      <div>
                        {isPending ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 13, color: '#999' }}>
                              等待中...
                            </span>
                            <button
                              className="secondary"
                              onClick={cancelJoinRequest}
                              style={{ fontSize: 13, padding: '4px 10px' }}
                            >
                              取消
                            </button>
                          </div>
                        ) : isRejected ? (
                          <span style={{ fontSize: 13, color: '#f44336' }}>
                            已拒绝
                          </span>
                        ) : isFull ? (
                          <button disabled style={{ fontSize: 13, padding: '4px 10px' }}>
                            已满
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleSendJoinRequest(room.roomCode)
                            }
                            style={{ fontSize: 13, padding: '4px 10px' }}
                          >
                            申请加入
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <label>
                  房间可见性
                  <div
                    className="stack"
                    style={{ flexDirection: 'row', gap: 8 }}
                  >
                    <button
                      className={visibility === 'public' ? '' : 'secondary'}
                      onClick={() => setVisibility('public')}
                      style={{ flex: 1 }}
                    >
                      公开
                    </button>
                    <button
                      className={visibility === 'private' ? '' : 'secondary'}
                      onClick={() => setVisibility('private')}
                      style={{ flex: 1 }}
                    >
                      私密
                    </button>
                  </div>
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
