// ============================================================
// 失落的城市 - 房间管理器
// ============================================================

import { customAlphabet, nanoid } from 'nanoid';
import {
  GameState,
  GameAction,
  ActionResult,
  RoomStateView,
  PlayerView,
  RoomListItem,
  RoomVisibility,
} from '@lost-cities/shared';
import {
  createGameState,
  applyAction,
  getPlayerView,
} from '@lost-cities/game-logic';
import type { WebSocket } from 'ws';

const ROOM_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const createCode = customAlphabet(ROOM_CODE_ALPHABET, 4);

/** 房间内玩家 */
export interface RoomPlayer {
  id: string;
  name: string;
  disconnectedAt?: number;
}

/** 待处理的加入申请 */
export interface PendingRequest {
  requestId: string;
  playerName: string;
  socketId: string;
}

/** 房间 */
export interface Room {
  code: string;
  visibility: RoomVisibility;
  hostId: string;
  hostName: string;
  createdAt: Date;
  pendingRequests: Map<string, PendingRequest>;
  players: RoomPlayer[];
  sockets: Map<string, WebSocket>;
  reconnectTokens: Map<string, string>;
  state: GameState;
}

function createRoomCode(): string {
  return createCode();
}

function normalizeRounds(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  if (parsed <= 0) return 0;
  return Math.max(1, Math.floor(parsed));
}

/**
 * 创建房间
 */
export function createRoom(
  roundsTotal?: unknown,
  visibility: RoomVisibility = 'private'
): Room {
  return {
    code: createRoomCode(),
    visibility,
    hostId: '',
    hostName: '',
    createdAt: new Date(),
    pendingRequests: new Map(),
    players: [],
    sockets: new Map(),
    reconnectTokens: new Map(),
    state: createGameState(normalizeRounds(roundsTotal)),
  };
}

/**
 * 添加玩家到房间
 */
export function addPlayer(
  room: Room,
  socket: WebSocket,
  name?: string
): { ok: boolean; player?: RoomPlayer; token?: string; error?: string } {
  if (room.players.length >= 2) {
    return { ok: false, error: 'Room full' };
  }
  const player: RoomPlayer = {
    id: nanoid(),
    name: name || 'Guest',
  };
  room.players.push(player);
  room.sockets.set(player.id, socket);
  const token = nanoid();
  room.reconnectTokens.set(token, player.id);
  return { ok: true, player, token };
}

/**
 * 移除玩家（标记断线）
 */
export function removePlayer(room: Room, playerId: string): void {
  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.disconnectedAt = Date.now();
  }
  room.sockets.delete(playerId);
}

/**
 * 清理超时断线玩家
 */
export function pruneRoom(room: Room, ttlMs: number): void {
  const now = Date.now();
  room.players = room.players.filter((p) => {
    if (!p.disconnectedAt) return true;
    return now - p.disconnectedAt < ttlMs;
  });
}

/**
 * 生成房间状态（玩家视角）
 */
export function roomStateFor(room: Room, playerId: string): RoomStateView {
  const index = room.players.findIndex((p) => p.id === playerId);
  return {
    code: room.code,
    players: room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      seat: i,
      connected: !p.disconnectedAt,
    })),
    you: playerId,
    playerIndex: index,
  };
}

/**
 * 生成游戏状态（玩家视角）
 */
export function gameStateFor(room: Room, playerId: string): PlayerView | null {
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) return null;
  return getPlayerView(room.state, index);
}

/**
 * 处理游戏动作
 */
export function handleAction(
  room: Room,
  playerId: string,
  action: GameAction
): ActionResult {
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) return { ok: false, error: 'Unknown player' };
  const connectedPlayers = room.players.filter(
    (player) => !player.disconnectedAt
  ).length;
  if (connectedPlayers < 2)
    return { ok: false, error: 'Waiting for both players' };
  const result = applyAction(room.state, index, action);
  return result;
}

/**
 * 重启游戏
 */
export function restartRoom(room: Room): ActionResult {
  const roundsTotal = room.state?.roundsTotal ?? 3;
  room.state = createGameState(roundsTotal);
  return { ok: true };
}

/**
 * 重连玩家
 */
export function reconnectPlayer(
  room: Room,
  socket: WebSocket,
  token: string
): { ok: boolean; playerId?: string; error?: string } {
  const playerId = room.reconnectTokens.get(token);
  if (!playerId) return { ok: false, error: 'Invalid token' };
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: 'Player not found' };
  delete player.disconnectedAt;
  room.sockets.set(playerId, socket);
  return { ok: true, playerId };
}

// ============================================================
// 大厅功能
// ============================================================

/**
 * 获取公开房间列表
 */
export function getPublicRoomList(rooms: Map<string, Room>): RoomListItem[] {
  const publicRooms: RoomListItem[] = [];
  for (const room of rooms.values()) {
    if (room.visibility === 'public') {
      const connectedCount = room.players.filter(
        (p) => !p.disconnectedAt
      ).length;
      publicRooms.push({
        roomCode: room.code,
        hostName: room.hostName,
        playerCount: connectedCount,
        maxPlayers: 2,
        status: room.players.length >= 2 ? 'playing' : 'waiting',
        createdAt: room.createdAt.toISOString(),
      });
    }
  }
  return publicRooms;
}

/**
 * 添加加入申请
 */
export function addJoinRequest(
  room: Room,
  requestId: string,
  playerName: string,
  socketId: string
): { ok: boolean; error?: string } {
  if (room.visibility !== 'public') {
    return { ok: false, error: 'Room is not public' };
  }
  if (room.players.length >= 2) {
    return { ok: false, error: 'Room is full' };
  }
  // 检查是否已有来自同一 socket 的申请
  for (const req of room.pendingRequests.values()) {
    if (req.socketId === socketId) {
      return { ok: false, error: 'Already requested' };
    }
  }
  room.pendingRequests.set(requestId, {
    requestId,
    playerName,
    socketId,
  });
  return { ok: true };
}

/**
 * 同意加入申请
 */
export function approveJoinRequest(
  room: Room,
  requestId: string,
  socket: WebSocket
): {
  ok: boolean;
  player?: RoomPlayer;
  token?: string;
  socketId?: string;
  error?: string;
} {
  const request = room.pendingRequests.get(requestId);
  if (!request) {
    return { ok: false, error: 'Request not found' };
  }
  if (room.players.length >= 2) {
    room.pendingRequests.delete(requestId);
    return { ok: false, error: 'Room is full' };
  }
  room.pendingRequests.delete(requestId);
  const result = addPlayer(room, socket, request.playerName);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    player: result.player,
    token: result.token,
    socketId: request.socketId,
  };
}

/**
 * 拒绝加入申请
 */
export function rejectJoinRequest(
  room: Room,
  requestId: string
): { ok: boolean; socketId?: string; error?: string } {
  const request = room.pendingRequests.get(requestId);
  if (!request) {
    return { ok: false, error: 'Request not found' };
  }
  const socketId = request.socketId;
  room.pendingRequests.delete(requestId);
  return { ok: true, socketId };
}

/**
 * 取消加入申请（申请者主动取消）
 */
export function cancelJoinRequest(
  room: Room,
  socketId: string
): { ok: boolean; requestId?: string; error?: string } {
  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.socketId === socketId) {
      room.pendingRequests.delete(reqId);
      return { ok: true, requestId: reqId };
    }
  }
  return { ok: false, error: 'No pending request found' };
}
