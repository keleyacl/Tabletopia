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

const panelClass =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-[#120d22]/80 shadow-2xl shadow-black/50 backdrop-blur-xl';
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-[#8f85aa] focus:border-fuchsia-300/60 focus:bg-white/8 focus:ring-2 focus:ring-fuchsia-300/20';
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100';
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45';

const roomVisibilityOptions: Array<{
  value: RoomVisibility;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    value: 'public',
    icon: '🌐',
    title: '公开房间',
    description: '出现在大厅列表里，其他玩家可以申请加入。',
  },
  {
    value: 'private',
    icon: '🔒',
    title: '私密房间',
    description: '不会出现在列表里，只能通过房间码直接进入。',
  },
];

const getConnectionMeta = (status: string) => {
  if (status === 'connected') {
    return {
      badge: '已连线',
      title: '水晶链路稳定',
      description: '你已经接入大厅，可以创建房间或加入对局。',
      tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
      dot: 'bg-emerald-300',
    };
  }

  if (status === 'connecting') {
    return {
      badge: '连接中',
      title: '正在打磨宝石链路',
      description: '服务器握手进行中，通常只需要几秒。',
      tone: 'border-amber-300/30 bg-amber-300/10 text-amber-50',
      dot: 'bg-amber-200',
    };
  }

  return {
    badge: '未连接',
    title: '尚未进入大厅',
    description: '先输入昵称建立连接，再开始匹配对局。',
    tone: 'border-white/10 bg-white/5 text-white/80',
    dot: 'bg-white/60',
  };
};

const getRoomStatusMeta = (status: string) => {
  if (status === 'waiting') {
    return {
      label: '等待中',
      className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    };
  }

  return {
    label: '游戏中',
    className: 'border-amber-300/30 bg-amber-300/10 text-amber-50',
  };
};

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

  const connectionMeta = getConnectionMeta(connectionStatus);
  const lobbyStage = roomId
    ? isHost
      ? '房主待机'
      : '等待开局'
    : pendingJoinRequest
      ? '审批中'
      : connectionStatus === 'connected'
        ? '大厅'
        : '准备连接';

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070512] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#080612] via-[#160e2b] to-[#04060b]" />
      <div className="absolute left-[-10%] top-[-12%] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute bottom-[-18%] right-[-8%] h-96 w-96 rounded-full bg-cyan-400/18 blur-3xl" />
      <div className="absolute right-[22%] top-[18%] h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className={`${panelClass} p-8 sm:p-10`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-cyan-300/6" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.28em] ${connectionMeta.tone}`}
                >
                  <span className={`h-2 w-2 rounded-full ${connectionMeta.dot}`} />
                  {connectionMeta.badge}
                </div>

                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.38em] text-fuchsia-100/60">Splendor Duel Lobby</p>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                      <span className="mr-3 inline-block animate-float">💎</span>
                      <span className="bg-gradient-to-r from-cyan-200 via-fuchsia-100 to-amber-200 bg-clip-text text-transparent">
                        璀璨宝石·对决
                      </span>
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-[#c9bddf] sm:text-lg">
                      连接大厅，创建房间，等待对手入席。这里应该像宝石桌面，而不是一张默认白卡片。
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.28em] text-white/45">当前阶段</div>
                    <div className="mt-2 text-xl font-semibold text-white">{lobbyStage}</div>
                    <div className="mt-1 text-sm text-[#9f95b8]">{connectionMeta.description}</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.28em] text-white/45">玩家身份</div>
                    <div className="mt-2 text-xl font-semibold text-white">{playerName || inputName || '未命名玩家'}</div>
                    <div className="mt-1 text-sm text-[#9f95b8]">
                      {playerId !== null ? `当前座位 P${playerId + 1}` : '连接后将自动分配座位编号'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/8 p-4">
                  <div className="text-sm font-semibold text-fuchsia-100">双人对决</div>
                  <div className="mt-1 text-sm text-[#b8add1]">围绕棋盘中线争夺宝石与卡牌节奏。</div>
                </div>
                <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                  <div className="text-sm font-semibold text-cyan-50">公开匹配</div>
                  <div className="mt-1 text-sm text-[#b8add1]">大厅列表实时刷新，适合直接找人开局。</div>
                </div>
                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/8 p-4">
                  <div className="text-sm font-semibold text-amber-100">房间码入场</div>
                  <div className="mt-1 text-sm text-[#b8add1]">私密对局走邀请码，不暴露房间列表。</div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${panelClass} p-6 sm:p-8`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/6 via-transparent to-transparent" />
            <div className="relative space-y-6">
              {connectionStatus !== 'connected' ? (
                <>
                  <div className="space-y-2">
                    <div className="text-sm uppercase tracking-[0.3em] text-white/45">进入大厅</div>
                    <h2 className="text-3xl font-bold text-white">建立你的第一条连线</h2>
                    <p className="text-sm leading-6 text-[#a79cbe]">
                      先设置昵称。连接完成后，房间列表会自动刷新，你可以直接建房或输入房间码加入。
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <label className="mb-3 block text-sm font-medium text-white/80">你的昵称</label>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="例如：GemMaster"
                      className={inputClass}
                      maxLength={20}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    />
                    <div className="mt-3 text-xs leading-5 text-[#9187ab]">昵称只用于本局展示，20 个字符以内。</div>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={!inputName.trim() || connectionStatus === 'connecting'}
                    className={`w-full ${primaryButtonClass}`}
                  >
                    {connectionStatus === 'connecting' ? '正在连接服务器...' : '连接服务器'}
                  </button>
                </>
              ) : roomId ? (
                <>
                  <div className="space-y-2">
                    <div className="text-sm uppercase tracking-[0.3em] text-white/45">房间已就绪</div>
                    <h2 className="text-3xl font-bold text-white">{isHost ? '等待对手入席' : '已进入房间'}</h2>
                    <p className="text-sm leading-6 text-[#a79cbe]">
                      {isHost
                        ? '把房间码发给朋友，或等待大厅申请。两名玩家到齐后会自动进入棋盘。'
                        : '房主确认后，对局会在双方状态同步后自动开始。'}
                    </p>
                  </div>

                  <div className="rounded-[26px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/12 via-violet-500/10 to-cyan-400/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-fuchsia-100/60">房间码</div>
                        <div className="mt-2 text-4xl font-black tracking-[0.18em] text-white">{roomId}</div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/80">
                        {isHost ? '房主' : '访客'}
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-white/45">当前人数</div>
                        <div className="mt-2 text-xl font-semibold text-white">
                          {roomInfo ? `${roomInfo.players.length}/2` : '1/2'}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-white/45">状态</div>
                        <div className="mt-2 text-xl font-semibold text-white">等待开局</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[#b7accf]">
                    分享这段房间码给对手即可进入。大厅申请通过后，页面会自动切到游戏棋盘。
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-emerald-100">已连接到服务器</div>
                      <div className="text-xs text-emerald-50/70">房间列表会自动刷新，当前昵称为 {playerName}</div>
                    </div>
                    <div className="rounded-full border border-emerald-300/20 bg-black/15 px-3 py-1 text-xs text-emerald-100">
                      实时大厅
                    </div>
                  </div>

                  {pendingJoinRequest ? (
                    <div className="space-y-4 rounded-[26px] border border-amber-300/20 bg-amber-300/10 p-6">
                      <div className="space-y-2">
                        <div className="text-sm uppercase tracking-[0.28em] text-amber-100/70">等待审批</div>
                        <div className="text-2xl font-bold text-amber-50">已发送加入申请</div>
                        <div className="text-sm text-amber-50/75">房主确认前，你会停留在这里等待结果。</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-white/45">目标房间</div>
                        <div className="mt-2 text-3xl font-black tracking-[0.14em] text-white">
                          {pendingJoinRequest.roomId}
                        </div>
                      </div>
                      <button onClick={handleCancelJoinRequest} className={`w-full ${secondaryButtonClass}`}>
                        取消申请
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/20 p-5">
                        <div className="space-y-1">
                          <div className="text-sm uppercase tracking-[0.28em] text-white/45">创建房间</div>
                          <h2 className="text-2xl font-bold text-white">选择你的开局方式</h2>
                        </div>

                        <div className="grid gap-3">
                          {roomVisibilityOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setRoomVisibility(option.value)}
                              className={`rounded-3xl border p-4 text-left transition ${
                                roomVisibility === option.value
                                  ? 'border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/18 to-cyan-400/12'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl">{option.icon}</div>
                                <div className="min-w-0">
                                  <div className="text-base font-semibold text-white">{option.title}</div>
                                  <div className="mt-1 text-sm leading-6 text-[#a79cbe]">{option.description}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <button onClick={handleCreateRoom} className={`w-full ${primaryButtonClass}`}>
                          创建新房间
                        </button>
                      </div>

                      <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm uppercase tracking-[0.28em] text-white/45">公开房间</div>
                            <h3 className="mt-1 text-xl font-bold text-white">大厅列表</h3>
                          </div>
                          <button
                            onClick={handleManualRefresh}
                            disabled={roomListLoading}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-45"
                          >
                            {roomListLoading ? '刷新中...' : `刷新 ${refreshCountdown}s`}
                          </button>
                        </div>

                        {roomList.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-5 py-8 text-center">
                            <div className="text-3xl">🏜️</div>
                            <div className="mt-3 text-base font-medium text-white/90">大厅里暂时没有公开房间</div>
                            <div className="mt-2 text-sm text-[#9c92b5]">你可以先创建一个，或等下一轮自动刷新。</div>
                          </div>
                        ) : (
                          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                            {roomList.map((room) => {
                              const roomStatusMeta = getRoomStatusMeta(room.status);

                              return (
                                <div
                                  key={room.roomId}
                                  className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-fuchsia-300/30 hover:bg-white/8"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="truncate text-base font-semibold text-white">{room.hostName}</div>
                                        <span
                                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${roomStatusMeta.className}`}
                                        >
                                          {roomStatusMeta.label}
                                        </span>
                                      </div>
                                      <div className="mt-2 text-sm text-[#a79cbe]">
                                        {room.playerCount}/{room.maxPlayers} 人 · 房间码 {room.roomId}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleSendJoinRequest(room.roomId)}
                                      disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                                      className={
                                        room.status === 'waiting' && room.playerCount < room.maxPlayers
                                          ? primaryButtonClass
                                          : secondaryButtonClass
                                      }
                                    >
                                      {room.status === 'waiting' && room.playerCount < room.maxPlayers
                                        ? '申请加入'
                                        : '不可加入'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/20 p-5">
                        <div>
                          <div className="text-sm uppercase tracking-[0.28em] text-white/45">房间码加入</div>
                          <h3 className="mt-1 text-xl font-bold text-white">直接进入指定房间</h3>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            value={inputRoomCode}
                            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                            placeholder="输入房间码"
                            className={`${inputClass} uppercase sm:flex-1`}
                            maxLength={8}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                          />
                          <button
                            onClick={handleJoinRoom}
                            disabled={!inputRoomCode.trim()}
                            className={`sm:w-auto ${primaryButtonClass}`}
                          >
                            加入房间
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <JoinRequestModal />
    </div>
  );
};

export default Lobby;
