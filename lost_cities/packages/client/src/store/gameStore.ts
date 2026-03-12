// ============================================================
// 失落的城市 - 游戏状态 Store (Zustand + Immer)
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  PlayerView,
  RoomStateView,
  Card,
  Color,
  ChatMessage,
  RoomListItem,
  JoinRequest,
  RoomVisibility,
} from '@lost-cities/shared';
import { COLOR_ORDER, COLOR_INFO, ERROR_MESSAGE_MAP } from '@lost-cities/shared';
import { scoreExpedition } from '@lost-cities/game-logic';
import { socketService } from '../services/socketService';

// ============================================================
// 辅助函数
// ============================================================

function sortHand(cards: Card[] | undefined): Card[] {
  if (!cards) return [];
  return [...cards].sort((a, b) => {
    const colorDiff = (COLOR_ORDER[a.color] ?? 0) - (COLOR_ORDER[b.color] ?? 0);
    if (colorDiff !== 0) return colorDiff;
    const typeWeight = (card: Card) => (card.type === 'wager' ? 0 : 1);
    const typeDiff = typeWeight(a) - typeWeight(b);
    if (typeDiff !== 0) return typeDiff;
    if (a.type === 'number' && b.type === 'number') return a.value - b.value;
    return 0;
  });
}

function mapServerError(message: unknown): string {
  const text = typeof message === 'string' ? message.trim() : '';
  return ERROR_MESSAGE_MAP[text] || text || '未知错误';
}

function normalizeRoomCode(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 4);
}

function getInviteCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return normalizeRoomCode(params.get('invite') || '');
}

export function buildInviteLink(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const code = normalizeRoomCode(roomCode);
  if (!code) return '';
  const url = new URL(window.location.href);
  url.searchParams.set('invite', code);
  return url.toString();
}

function formatActionTime(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatChatTime(value?: number): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return formatActionTime();
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function copyTextByExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.top = '0';
  input.style.left = '0';
  input.style.width = '1px';
  input.style.height = '1px';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  document.body.appendChild(input);

  const selection = document.getSelection();
  const originalRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(input);
  if (selection) {
    selection.removeAllRanges();
    if (originalRange) {
      selection.addRange(originalRange);
    }
  }
  return copied;
}

export async function copyText(text: unknown): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;

  const canUseClipboardApi =
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function' &&
    (typeof window === 'undefined' || window.isSecureContext);

  if (canUseClipboardApi) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fallback
    }
  }
  return copyTextByExecCommand(value);
}

function describePlayAction(
  prevState: PlayerView | null,
  nextState: PlayerView,
  actorSeat: number,
  selfSeat: number
): string {
  const prevExpeditions =
    actorSeat === selfSeat
      ? prevState?.your.expeditions
      : prevState?.opponent.expeditions;
  const nextExpeditions =
    actorSeat === selfSeat
      ? nextState.your.expeditions
      : nextState.opponent.expeditions;

  for (const color of COLOR_INFO) {
    const prevLen = prevExpeditions?.[color.id]?.length ?? 0;
    const nextLen = nextExpeditions?.[color.id]?.length ?? 0;
    if (nextLen > prevLen) {
      return `打出了${color.name}探险牌`;
    }
  }

  for (const color of COLOR_INFO) {
    const prevTopId = prevState?.discardTops?.[color.id]?.id ?? null;
    const nextTop = nextState.discardTops?.[color.id];
    if (nextTop && nextTop.id !== prevTopId) {
      return `弃掉了${color.name}牌`;
    }
  }

  return '完成了出牌';
}

function describeDrawAction(
  prevState: PlayerView | null,
  nextState: PlayerView
): string {
  if ((nextState.roundIndex ?? 0) > (prevState?.roundIndex ?? 0)) {
    return '完成了抽牌，进入下一局';
  }

  if (!prevState?.finished && nextState.finished) {
    return '完成了抽牌，本局结束';
  }

  if ((nextState.deckCount ?? 0) < (prevState?.deckCount ?? 0)) {
    return '从牌堆抽了一张牌';
  }

  for (const color of COLOR_INFO) {
    const prevTopId = prevState?.discardTops?.[color.id]?.id ?? null;
    const nextTopId = nextState.discardTops?.[color.id]?.id ?? null;
    if (prevTopId !== nextTopId) {
      return `从${color.name}弃牌堆抽了一张牌`;
    }
  }

  return '完成了抽牌';
}

// ============================================================
// Toast 类型
// ============================================================

export interface Toast {
  id: number;
  text: string;
}

export interface ActionHistoryEntry {
  id: number;
  text: string;
  at: string;
}

// ============================================================
// Store 接口
// ============================================================

interface GameStoreState {
  // --- 连接 ---
  connected: boolean;
  socketSession: number;
  activeHost: string;
  activePort: string;
  pendingHost: string;
  pendingPort: string;

  // --- 房间 ---
  roomState: RoomStateView | null;
  gameState: PlayerView | null;
  name: string;
  roomCode: string;
  invitedRoomCode: string;
  reconnectToken: string;
  reconnectCode: string;
  roundsTotal: string;

  // --- 大厅 ---
  roomList: RoomListItem[];
  roomListLoading: boolean;
  pendingJoinRequest: { roomCode: string; status: 'pending' | 'approved' | 'rejected' } | null;
  incomingJoinRequest: JoinRequest | null;
  showJoinRequestModal: boolean;
  visibility: RoomVisibility;

  // --- 游戏 UI ---
  selectedCardId: number | null;
  phaseAction: string | null;
  roundContinueSent: boolean;
  roundResultSeenKey: string;

  // --- 弹窗 ---
  showCreateModal: boolean;
  showJoinModal: boolean;
  showRulesModal: boolean;
  showGameMenu: boolean;
  showActionHistory: boolean;
  showChatPanel: boolean;

  // --- Toast & 历史 ---
  toasts: Toast[];
  actionHistory: ActionHistoryEntry[];
  chatMessages: ChatMessage[];
  chatInput: string;
  copied: boolean;
  inviteCopied: boolean;

  // --- 内部计数器 ---
  _nextToastId: number;
  _nextActionHistoryId: number;
  _prevRoomState: RoomStateView | null;
  _prevGameState: PlayerView | null;
  _invitePrompted: boolean;

  // --- 动作 ---
  setName: (name: string) => void;
  setRoomCode: (code: string) => void;
  setRoundsTotal: (value: string) => void;
  setPendingHost: (host: string) => void;
  setPendingPort: (port: string) => void;
  setChatInput: (text: string) => void;
  setSelectedCardId: (id: number | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
  setShowRulesModal: (show: boolean) => void;
  setShowGameMenu: (show: boolean) => void;
  setShowActionHistory: (show: boolean) => void;
  setShowChatPanel: (show: boolean) => void;
  setRoundResultSeenKey: (key: string) => void;
  setCopied: (v: boolean) => void;
  setInviteCopied: (v: boolean) => void;

  setVisibility: (v: RoomVisibility) => void;

  pushToast: (text: string) => void;
  removeToast: (id: number) => void;
  pushActionHistory: (text: string) => void;

  fetchRoomList: () => void;
  sendJoinRequest: (roomCode: string) => void;
  cancelJoinRequest: () => void;
  respondToJoinRequest: (requestId: string, approved: boolean) => void;

  applyServerAddress: () => void;
  initSocket: () => void;
  handleServerMessage: (msg: any) => void;
  handleGameStateChange: () => void;
  handleRoomStateChange: () => void;

  createRoom: () => void;
  joinRoom: () => void;
  reconnect: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  continueRound: () => void;
  playCard: (target: 'expedition' | 'discard') => void;
  drawCard: (source: 'deck' | 'discard', color?: Color) => void;
  sendChatMessage: (text?: string) => void;
}

// ============================================================
// 默认值
// ============================================================

function getDefaultHost(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname || 'localhost';
}

function getDefaultPort(): string {
  const host = getDefaultHost();
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (typeof window !== 'undefined' && window.location.port) {
    return window.location.port;
  }
  return isLocal ? '3005' : '';
}

function getSocketProtocol(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'wss';
  }
  return 'ws';
}

function getSocketBasePath(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

// ============================================================
// Store 实现
// ============================================================

export const useGameStore = create<GameStoreState>()(
  immer((set, get) => ({
    // --- 初始状态 ---
    connected: false,
    socketSession: 0,
    activeHost: getDefaultHost(),
    activePort: getDefaultPort(),
    pendingHost: getDefaultHost(),
    pendingPort: getDefaultPort(),

    roomState: null,
    gameState: null,
    name: '',
    roomCode: getInviteCodeFromUrl(),
    invitedRoomCode: getInviteCodeFromUrl(),
    reconnectToken:
      typeof window !== 'undefined'
        ? localStorage.getItem('lostcities-token') || ''
        : '',
    reconnectCode:
      typeof window !== 'undefined'
        ? localStorage.getItem('lostcities-code') || ''
        : '',
    roundsTotal: '3',

    roomList: [],
    roomListLoading: false,
    pendingJoinRequest: null,
    incomingJoinRequest: null,
    showJoinRequestModal: false,
    visibility: 'public' as RoomVisibility,

    selectedCardId: null,
    phaseAction: null,
    roundContinueSent: false,
    roundResultSeenKey: '',

    showCreateModal: false,
    showJoinModal: false,
    showRulesModal: false,
    showGameMenu: false,
    showActionHistory: false,
    showChatPanel: false,

    toasts: [],
    actionHistory: [],
    chatMessages: [],
    chatInput: '',
    copied: false,
    inviteCopied: false,

    _nextToastId: 1,
    _nextActionHistoryId: 1,
    _prevRoomState: null,
    _prevGameState: null,
    _invitePrompted: false,

    // --- 简单 setter ---
    setName: (name) => set({ name }),
    setRoomCode: (code) => set({ roomCode: code }),
    setRoundsTotal: (value) => set({ roundsTotal: value }),
    setPendingHost: (host) => set({ pendingHost: host }),
    setPendingPort: (port) => set({ pendingPort: port }),
    setChatInput: (text) => set({ chatInput: text }),
    setSelectedCardId: (id) => set({ selectedCardId: id }),
    setShowCreateModal: (show) => set({ showCreateModal: show }),
    setShowJoinModal: (show) => set({ showJoinModal: show }),
    setShowRulesModal: (show) => set({ showRulesModal: show }),
    setShowGameMenu: (show) => set({ showGameMenu: show }),
    setShowActionHistory: (show) => set({ showActionHistory: show }),
    setShowChatPanel: (show) => set({ showChatPanel: show }),
    setRoundResultSeenKey: (key) => set({ roundResultSeenKey: key }),
    setCopied: (v) => set({ copied: v }),
    setInviteCopied: (v) => set({ inviteCopied: v }),
    setVisibility: (v) => set({ visibility: v }),

    // --- 大厅动作 ---
    fetchRoomList: () => {
      set({ roomListLoading: true });
      socketService.send('lobby:list');
      // 3秒超时保护
      setTimeout(() => {
        if (get().roomListLoading) {
          set({ roomListLoading: false });
        }
      }, 3000);
    },

    sendJoinRequest: (roomCode) => {
      const { name } = get();
      socketService.send('lobby:join_request', {
        roomCode,
        name: name || 'Guest',
      });
      set({ pendingJoinRequest: { roomCode, status: 'pending' } });
    },

    cancelJoinRequest: () => {
      const { pendingJoinRequest } = get();
      if (!pendingJoinRequest) return;
      socketService.send('lobby:cancel_request', {
        roomCode: pendingJoinRequest.roomCode,
      });
      set({ pendingJoinRequest: null });
    },

    respondToJoinRequest: (requestId, approved) => {
      socketService.send('lobby:join_response', { requestId, approved });
      set({ incomingJoinRequest: null, showJoinRequestModal: false });
    },

    // --- Toast ---
    pushToast: (text) => {
      if (!text) return;
      set((state) => {
        const id = state._nextToastId++;
        state.toasts = [...state.toasts, { id, text }].slice(-4);
        // 自动移除
        setTimeout(() => {
          get().removeToast(id);
        }, 2800);
      });
    },

    removeToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter((t: Toast) => t.id !== id);
      });
    },

    pushActionHistory: (text) => {
      if (!text) return;
      set((state) => {
        const id = state._nextActionHistoryId++;
        const entry: ActionHistoryEntry = { id, text, at: formatActionTime() };
        state.actionHistory = [...state.actionHistory, entry].slice(-80);
      });
    },

    // --- 连接管理 ---
    applyServerAddress: () => {
      const { pendingHost, pendingPort } = get();
      const host = pendingHost.trim() || getDefaultHost();
      const port = pendingPort.trim();
      set({ activeHost: host, activePort: port });
      get().initSocket();
    },

    initSocket: () => {
      const { activeHost, activePort, socketSession } = get();
      const protocol = getSocketProtocol();
      const portPart = activePort ? `:${activePort}` : '';
      const socketBasePath = getSocketBasePath();
      const url = `${protocol}://${activeHost}${portPart}${socketBasePath}ws/?session=${socketSession}`;

      socketService.disconnect();
      socketService.connect(url);

      // 监听连接状态
      const checkConnection = setInterval(() => {
        const isConnected = socketService.connected;
        if (get().connected !== isConnected) {
          set({ connected: isConnected });
        }
      }, 500);

      // 监听消息
      socketService.onMessage((msg) => {
        get().handleServerMessage(msg);
      });
    },

    handleServerMessage: (msg) => {
      const { type, payload } = msg;

      if (type === 'room:state') {
        set({ roomState: payload });
        get().handleRoomStateChange();
      }

      if (type === 'game:state') {
        set((state) => {
          state._prevGameState = state.gameState;
          state.gameState = payload;
        });
        // 更新 phase
        const gs = get().gameState;
        if (gs?.phase === 'draw') {
          set({ phaseAction: 'draw' });
        } else {
          set({ phaseAction: null, selectedCardId: null });
        }
        get().handleGameStateChange();
      }

      if (type === 'room:token') {
        if (payload?.token) {
          localStorage.setItem('lostcities-token', payload.token);
          set({ reconnectToken: payload.token });
        }
      }

      if (type === 'error') {
        const errorText = mapServerError(payload?.message);
        get().pushToast(errorText);
      }

      if (type === 'room:chat') {
        const item = payload;
        if (!item?.text) return;
        const chatEntry: ChatMessage = {
          id:
            item.id ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          senderId: item.senderId || '',
          senderName: item.senderName || '玩家',
          text: String(item.text),
          at: item.at || Date.now(),
        };
        set((state) => {
          state.chatMessages = [...state.chatMessages, chatEntry].slice(-80);
        });
        const rs = get().roomState;
        if (item.senderId && item.senderId !== rs?.you) {
          get().pushToast(`${chatEntry.senderName}：${chatEntry.text}`);
        }
      }

      // --- 大厅消息处理 ---
      if (type === 'lobby:room_list') {
        set({
          roomList: payload?.rooms ?? [],
          roomListLoading: false,
        });
      }

      if (type === 'lobby:join_request_received') {
        set({
          incomingJoinRequest: {
            requestId: payload?.requestId ?? '',
            playerName: payload?.playerName ?? 'Guest',
            roomCode: payload?.roomCode ?? '',
            timestamp: payload?.timestamp ?? Date.now(),
          },
          showJoinRequestModal: true,
        });
      }

      if (type === 'lobby:join_approved') {
        set({
          pendingJoinRequest: null,
          roomCode: payload?.roomCode ?? '',
        });
        // 保存 reconnect token
        if (payload?.reconnectToken) {
          localStorage.setItem('lostcities-token', payload.reconnectToken);
          set({ reconnectToken: payload.reconnectToken });
        }
        get().pushToast('加入申请已通过！');
      }

      if (type === 'lobby:join_rejected') {
        set((state) => {
          if (state.pendingJoinRequest) {
            state.pendingJoinRequest = {
              ...state.pendingJoinRequest,
              status: 'rejected',
            };
          }
        });
        get().pushToast(payload?.reason || '加入申请被拒绝');
        // 3秒后清除拒绝状态
        setTimeout(() => {
          set({ pendingJoinRequest: null });
        }, 3000);
      }

      if (type === 'lobby:request_cancelled') {
        set({
          incomingJoinRequest: null,
          showJoinRequestModal: false,
        });
      }
    },

    handleRoomStateChange: () => {
      const { roomState, _prevRoomState } = get();
      if (!roomState) return;

      // 保存房间码
      if (roomState.code) {
        localStorage.setItem('lostcities-code', roomState.code);
        set({ reconnectCode: roomState.code });
      }

      // 检测新玩家加入
      if (_prevRoomState) {
        if (_prevRoomState.code !== roomState.code) {
          set({ showActionHistory: false, actionHistory: [] });
        }
        const prevIds = new Set(
          _prevRoomState.players.map((p) => p.id)
        );
        const joinedPlayers = roomState.players.filter(
          (p) => !prevIds.has(p.id)
        );
        for (const player of joinedPlayers) {
          get().pushToast(`${player.name} 加入了房间`);
        }
      }

      set({ _prevRoomState: roomState });
    },

    handleGameStateChange: () => {
      const { gameState, _prevGameState, roomState } = get();
      if (!gameState || !roomState) return;

      const playerIndex = roomState.playerIndex;
      const prevGame = _prevGameState;

      if (!prevGame) return;

      // 检测重新开始
      if (
        (gameState.roundIndex ?? 1) === 1 &&
        (gameState.history?.length ?? 0) === 0 &&
        ((prevGame.roundIndex ?? 1) !== 1 ||
          (prevGame.history?.length ?? 0) > 0)
      ) {
        get().pushToast('对局已重新开始');
        set({
          actionHistory: [],
          roundResultSeenKey: '',
          roundContinueSent: false,
        });
        get().pushActionHistory('对局已重新开始');
        return;
      }

      // 检测出牌/抽牌动作
      const playerNamesBySeat = new Map(
        roomState.players.map((p) => [p.seat, p.name])
      );
      const actorName = (seat: number) =>
        seat === playerIndex ? '你' : playerNamesBySeat.get(seat) || '对手';

      if (
        prevGame.phase === 'play' &&
        gameState.phase === 'draw' &&
        prevGame.turn === gameState.turn
      ) {
        const actorSeat = gameState.turn;
        const actionText = `${actorName(actorSeat)}${describePlayAction(
          prevGame,
          gameState,
          actorSeat,
          playerIndex
        )}`;
        get().pushToast(actionText);
        get().pushActionHistory(actionText);
      } else if (
        prevGame.phase === 'draw' &&
        gameState.phase === 'play' &&
        prevGame.turn !== gameState.turn
      ) {
        const actorSeat = prevGame.turn;
        const actionText = `${actorName(actorSeat)}${describeDrawAction(
          prevGame,
          gameState
        )}`;
        get().pushToast(actionText);
        get().pushActionHistory(actionText);
      }

      // 重置 roundContinueSent
      const roundResult = gameState.roundResult;
      const roundResultKey = roundResult
        ? `${roundResult.roundIndex}:${roundResult.scores?.[0] ?? 0}:${roundResult.scores?.[1] ?? 0}`
        : '';
      const prevRoundResult = prevGame.roundResult;
      const prevRoundResultKey = prevRoundResult
        ? `${prevRoundResult.roundIndex}:${prevRoundResult.scores?.[0] ?? 0}:${prevRoundResult.scores?.[1] ?? 0}`
        : '';
      if (roundResultKey !== prevRoundResultKey) {
        set({ roundContinueSent: false });
      }
    },

    // --- 游戏动作 ---
    createRoom: () => {
      const { name, roundsTotal, visibility } = get();
      socketService.send('room:create', {
        name: name || 'Guest',
        roundsTotal,
        visibility,
      });
    },

    joinRoom: () => {
      const { roomCode, name } = get();
      if (!roomCode) {
        get().pushToast('请输入房间码');
        return;
      }
      socketService.send('room:join', {
        code: roomCode.trim().toUpperCase(),
        name: name || 'Guest',
      });
    },

    reconnect: () => {
      const { reconnectCode, reconnectToken } = get();
      if (!reconnectCode || !reconnectToken) return;
      socketService.send('room:reconnect', {
        code: reconnectCode,
        token: reconnectToken,
      });
    },

    restartGame: () => {
      set({ showGameMenu: false });
      socketService.send('game:restart');
      get().pushToast('已发送重新开始请求');
    },

    leaveRoom: () => {
      set({
        showGameMenu: false,
        showActionHistory: false,
        showChatPanel: false,
        roundContinueSent: false,
        roundResultSeenKey: '',
        actionHistory: [],
        chatMessages: [],
        chatInput: '',
        roomState: null,
        gameState: null,
        selectedCardId: null,
        phaseAction: null,
        reconnectToken: '',
        reconnectCode: '',
        _prevRoomState: null,
        _prevGameState: null,
        _nextActionHistoryId: 1,
      });
      localStorage.removeItem('lostcities-token');
      localStorage.removeItem('lostcities-code');
      set((state) => {
        state.socketSession += 1;
      });
      get().pushToast('已退出房间');
      get().initSocket();
    },

    continueRound: () => {
      const { gameState, roundContinueSent } = get();
      if (!gameState?.roundResult?.canContinue || roundContinueSent) return;
      socketService.send('game:action', { type: 'continue_round' });
      set({ roundContinueSent: true });
    },

    playCard: (target) => {
      const { selectedCardId, roomState, gameState } = get();
      if (!selectedCardId) return;
      const connectedCount =
        roomState?.players?.filter((p) => p.connected !== false).length ?? 0;
      if (connectedCount < 2) return;
      if (gameState?.roundResult?.canContinue) return;
      socketService.send('game:action', {
        type: 'play_card',
        payload: { cardId: selectedCardId, target },
      });
      set({ selectedCardId: null });
    },

    drawCard: (source, color) => {
      const { roomState, gameState } = get();
      const connectedCount =
        roomState?.players?.filter((p) => p.connected !== false).length ?? 0;
      if (connectedCount < 2) return;
      if (gameState?.roundResult?.canContinue) return;
      socketService.send('game:action', {
        type: 'draw_card',
        payload: { source, color },
      });
    },

    sendChatMessage: (text) => {
      const normalized = String(text ?? get().chatInput ?? '').trim();
      if (!normalized) {
        get().pushToast('消息不能为空');
        return;
      }
      socketService.send('room:chat', { text: normalized });
      set({ chatInput: '' });
    },
  }))
);
