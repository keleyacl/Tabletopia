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
  'relative overflow-hidden rounded-[28px] border border-white/12 bg-[#120d22]/92 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl';
const surfaceClass = 'rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5';
const sectionLabelClass = 'text-xs font-medium text-white/52';
const inputClass =
  'w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-base text-white outline-none transition placeholder:text-[#8f85aa] focus:border-cyan-300/55 focus:bg-white/[0.1] focus:ring-2 focus:ring-cyan-300/15';
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/35 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100';
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45';

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

  const playerDisplayName = playerName || inputName || '未命名玩家';
  const roomPlayerCount = roomInfo ? roomInfo.players.length : 1;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070512] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#080612] via-[#160e2b] to-[#04060b]" />
      <div className="pointer-events-none absolute left-[-12%] top-[-16%] h-96 w-96 rounded-full bg-fuchsia-500/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-22%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/14 blur-3xl" />
      <div className="pointer-events-none absolute right-[18%] top-[14%] h-56 w-56 rounded-full bg-amber-300/8 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {connectionStatus !== 'connected' ? (
          <main className="w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className={`${panelClass} p-8 sm:p-10`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_28%)]" />

                <div className="relative space-y-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] ${connectionMeta.tone}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${connectionMeta.dot}`} />
                      {connectionMeta.badge}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-fuchsia-100/55">
                      Splendor Duel
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-5xl leading-none sm:text-6xl">💎</div>
                    <h1 className="max-w-3xl bg-gradient-to-r from-cyan-200 via-fuchsia-100 to-amber-200 bg-clip-text text-4xl font-semibold leading-[1.08] text-transparent sm:text-5xl">
                      璀璨宝石·对决大厅
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-[#cdbfe2]">
                      建立连接后，就可以创建公开房间，或者输入房间码直接加入朋友的对局。
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={surfaceClass}>
                      <div className={sectionLabelClass}>当前状态</div>
                      <div className="mt-3 text-2xl font-semibold text-white">{lobbyStage}</div>
                      <p className="mt-2 text-sm leading-7 text-[#a99dc0]">{connectionMeta.description}</p>
                    </div>

                    <div className={surfaceClass}>
                      <div className={sectionLabelClass}>玩家信息</div>
                      <div className="mt-3 text-2xl font-semibold text-white">{playerDisplayName}</div>
                      <p className="mt-2 text-sm leading-7 text-[#a99dc0]">连接成功后自动分配座位编号</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${panelClass} p-6`}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/6 via-transparent to-transparent" />

                <div className="relative space-y-5">
                  <div className="space-y-2">
                    <div className={sectionLabelClass}>进入大厅</div>
                    <h2 className="text-2xl font-semibold text-white">建立连接</h2>
                    <p className="text-sm leading-7 text-[#ab9fc1]">
                      输入昵称后连接服务器。连接成功后就可以建房或加入现有房间。
                    </p>
                  </div>

                  <div>
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
                    <p className="mt-3 text-xs leading-5 text-[#9085a8]">仅用于当前对局展示，最多 20 个字符。</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-[#c6bbde]">
                    连接后大厅列表会自动刷新。你可以创建公开房间，也可以通过房间码直接加入。
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={!inputName.trim() || connectionStatus === 'connecting'}
                    className={`w-full ${primaryButtonClass}`}
                  >
                    {connectionStatus === 'connecting' ? '正在连接服务器...' : '连接服务器'}
                  </button>
                </div>
              </section>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-7 text-rose-100">
                {error}
              </div>
            )}
          </main>
        ) : roomId ? (
          <main className="w-full max-w-4xl">
            <section className={`${panelClass} p-8 sm:p-10`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_28%)]" />

              <div className="relative space-y-8">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] ${connectionMeta.tone}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${connectionMeta.dot}`} />
                    {connectionMeta.badge}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-fuchsia-100/55">
                    房间等待区
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                    {isHost ? '等待对手入席' : '已进入房间'}
                  </h1>
                  <p className="max-w-2xl text-sm leading-8 text-[#cdbfe2] sm:text-base">
                    {isHost
                      ? '把房间码发给对手，或等待大厅中的加入申请。两名玩家到齐后会自动进入棋盘。'
                      : '房主确认后，对局会在双方状态同步完成后自动开始。'}
                  </p>
                </div>

                <div className="rounded-[28px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/14 via-violet-500/10 to-cyan-400/12 p-6 sm:p-8">
                  <div className={sectionLabelClass}>房间码</div>
                  <div className="mt-4 text-5xl font-black tracking-[0.18em] text-white">{roomId}</div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className={sectionLabelClass}>身份</div>
                      <div className="mt-2 text-lg font-semibold text-white">{isHost ? '房主' : '访客'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className={sectionLabelClass}>当前人数</div>
                      <div className="mt-2 text-lg font-semibold text-white">{roomPlayerCount}/2</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className={sectionLabelClass}>房间类型</div>
                      <div className="mt-2 text-lg font-semibold text-white">{roomInfo?.visibility === 'private' ? '私密房间' : '公开房间'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-7 text-rose-100">
                {error}
              </div>
            )}
          </main>
        ) : (
          <main className="w-full max-w-6xl">
            <section className={`${panelClass} p-6 sm:p-8 lg:p-10`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_28%)]" />

              <div className="relative space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] ${connectionMeta.tone}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${connectionMeta.dot}`} />
                        {connectionMeta.badge}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-fuchsia-100/55">
                        Splendor Duel
                      </div>
                    </div>
                    <h1 className="text-3xl font-semibold text-white sm:text-4xl">璀璨宝石·对决大厅</h1>
                    <p className="max-w-2xl text-sm leading-8 text-[#cdbfe2] sm:text-base">
                      现在可以创建房间、查看大厅列表，或输入房间码直接进入指定对局。
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className={sectionLabelClass}>玩家信息</div>
                      <div className="mt-2 text-lg font-semibold text-white">{playerDisplayName}</div>
                      <p className="mt-2 text-sm leading-6 text-[#9388aa]">
                        {playerId !== null ? `当前座位 P${playerId + 1}` : '等待分配座位'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className={sectionLabelClass}>大厅状态</div>
                      <div className="mt-2 text-lg font-semibold text-white">{lobbyStage}</div>
                      <p className="mt-2 text-sm leading-6 text-[#9388aa]">当前可创建新房间或加入现有房间。</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    {pendingJoinRequest ? (
                      <section className="space-y-4 rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-6">
                        <div className="space-y-2">
                          <div className={sectionLabelClass}>等待审批</div>
                          <div className="text-2xl font-semibold text-amber-50">已发送加入申请</div>
                          <p className="text-sm leading-7 text-amber-50/75">房主确认前，你会停留在这里等待结果。</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                          <div className={sectionLabelClass}>目标房间</div>
                          <div className="mt-2 text-3xl font-black tracking-[0.14em] text-white">{pendingJoinRequest.roomId}</div>
                        </div>
                        <button onClick={handleCancelJoinRequest} className={`w-full ${secondaryButtonClass}`}>
                          取消申请
                        </button>
                      </section>
                    ) : (
                      <>
                        <section className={`${surfaceClass} space-y-4`}>
                          <div className="space-y-2">
                            <div className={sectionLabelClass}>创建房间</div>
                            <h2 className="text-2xl font-semibold text-white">选择开局方式</h2>
                            <p className="text-sm leading-7 text-[#ab9fc1]">
                              公开房间会显示在大厅列表，私密房间只接受房间码加入。
                            </p>
                          </div>

                          <div className="grid gap-3">
                            {roomVisibilityOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setRoomVisibility(option.value)}
                                className={`rounded-[22px] border p-4 text-left transition ${
                                  roomVisibility === option.value
                                    ? 'border-cyan-300/35 bg-gradient-to-r from-cyan-400/16 via-fuchsia-500/12 to-amber-300/16'
                                    : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">{option.icon}</div>
                                  <div className="min-w-0">
                                    <div className="text-base font-semibold text-white">{option.title}</div>
                                    <p className="mt-1 text-sm leading-7 text-[#ab9fc1]">{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>

                          <button onClick={handleCreateRoom} className={`w-full ${primaryButtonClass}`}>
                            创建新房间
                          </button>
                        </section>

                        <section className={`${surfaceClass} space-y-4`}>
                          <div className="space-y-2">
                            <div className={sectionLabelClass}>房间码加入</div>
                            <h3 className="text-xl font-semibold text-white">直接进入指定房间</h3>
                          </div>

                          <input
                            type="text"
                            value={inputRoomCode}
                            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                            placeholder="输入房间码"
                            className={`${inputClass} uppercase`}
                            maxLength={8}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                          />

                          <button
                            onClick={handleJoinRoom}
                            disabled={!inputRoomCode.trim()}
                            className={`w-full ${primaryButtonClass}`}
                          >
                            加入房间
                          </button>
                        </section>
                      </>
                    )}
                  </div>

                  <section className={`${surfaceClass} space-y-4`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className={sectionLabelClass}>公开房间</div>
                        <h3 className="text-xl font-semibold text-white">大厅列表</h3>
                        <p className="text-sm leading-7 text-[#ab9fc1]">大厅会自动刷新，你也可以手动刷新当前列表。</p>
                      </div>
                      <button
                        onClick={handleManualRefresh}
                        disabled={roomListLoading}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-45"
                      >
                        {roomListLoading ? '刷新中...' : `刷新 ${refreshCountdown}s`}
                      </button>
                    </div>

                    {roomList.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.03] px-5 py-10 text-center">
                        <div className="text-3xl">🏜️</div>
                        <div className="mt-3 text-base font-medium text-white/90">当前没有公开房间</div>
                        <p className="mt-2 text-sm leading-7 text-[#9f95b8]">你可以先创建一个，或者等待下一轮自动刷新。</p>
                      </div>
                    ) : (
                      <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                        {roomList.map((room) => {
                          const roomStatusMeta = getRoomStatusMeta(room.status);

                          return (
                            <div
                              key={room.roomId}
                              className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.08]"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="truncate text-base font-semibold text-white">{room.hostName}</div>
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${roomStatusMeta.className}`}
                                    >
                                      {roomStatusMeta.label}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-7 text-[#ab9fc1]">
                                    {room.playerCount}/{room.maxPlayers} 人 · 房间码 {room.roomId}
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleSendJoinRequest(room.roomId)}
                                  disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                                  className={`sm:shrink-0 ${
                                    room.status === 'waiting' && room.playerCount < room.maxPlayers
                                      ? primaryButtonClass
                                      : secondaryButtonClass
                                  }`}
                                >
                                  {room.status === 'waiting' && room.playerCount < room.maxPlayers ? '申请加入' : '不可加入'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-7 text-rose-100">
                    {error}
                  </div>
                )}
              </div>
            </section>
          </main>
        )}
      </div>
      <JoinRequestModal />
    </div>
  );
};

export default Lobby;
