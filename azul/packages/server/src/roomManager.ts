import { v4 as uuidv4 } from 'uuid';
import { GameState, RoomInfo, RestartVoteInfo, MIN_PLAYERS, MAX_PLAYERS, RoomVisibility, RoomListItem } from '@azul/shared';

// ============================================================
// 房间数据结构
// ============================================================

export interface RoomPlayer {
  id: string;
  name: string;
  socketId: string;
  connected: boolean;
}

export interface PendingRequest {
  requestId: string;
  playerName: string;
  socketId: string;
  timestamp: number;
}

export interface Room {
  id: string;
  hostId: string;
  players: RoomPlayer[];
  gameStarted: boolean;
  gameState: GameState | null;
  restartVotes: Set<string>;
  restartRequestedBy: string | null;
  visibility: RoomVisibility;
  createdAt: Date;
  pendingRequests: Map<string, PendingRequest>;
}

// 内存存储所有房间
const rooms: Map<string, Room> = new Map();

// socketId -> { roomId, playerId } 的映射，用于断线重连
const socketToRoom: Map<string, { roomId: string; playerId: string }> =
  new Map();

// ============================================================
// 房间管理函数
// ============================================================

/**
 * 生成 6 位房间号
 */
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // 确保不重复
  if (rooms.has(result)) {
    return generateRoomId();
  }
  return result;
}

/**
 * 创建房间
 * @param hostName 房主名称
 * @param socketId 房主的 socket ID
 * @returns 房间信息和玩家 ID
 */
export function createRoom(
  hostName: string,
  socketId: string,
  visibility: RoomVisibility = 'public'
): { roomInfo: RoomInfo; playerId: string } {
  const roomId = generateRoomId();
  const playerId = uuidv4();

  const player: RoomPlayer = {
    id: playerId,
    name: hostName,
    socketId,
    connected: true,
  };

  const room: Room = {
    id: roomId,
    hostId: playerId,
    players: [player],
    gameStarted: false,
    gameState: null,
    restartVotes: new Set(),
    restartRequestedBy: null,
    visibility,
    createdAt: new Date(),
    pendingRequests: new Map(),
  };

  rooms.set(roomId, room);
  socketToRoom.set(socketId, { roomId, playerId });

  return {
    roomInfo: toRoomInfo(room),
    playerId,
  };
}

/**
 * 加入房间
 * @param roomId 房间 ID
 * @param playerName 玩家名称
 * @param socketId 玩家的 socket ID
 * @returns 房间信息和玩家 ID，或错误信息
 */
export function joinRoom(
  roomId: string,
  playerName: string,
  socketId: string
): { roomInfo: RoomInfo; playerId: string } | { error: string } {
  const room = rooms.get(roomId);
  if (!room) {
    return { error: '房间不存在' };
  }

  if (room.gameStarted) {
    return { error: '游戏已开始，无法加入' };
  }

  if (room.players.length >= MAX_PLAYERS) {
    return { error: `房间已满（最多 ${MAX_PLAYERS} 人）` };
  }

  // 检查名称是否重复
  if (room.players.some((p) => p.name === playerName)) {
    return { error: '该名称已被使用' };
  }

  const playerId = uuidv4();
  const player: RoomPlayer = {
    id: playerId,
    name: playerName,
    socketId,
    connected: true,
  };

  room.players.push(player);
  socketToRoom.set(socketId, { roomId, playerId });

  return {
    roomInfo: toRoomInfo(room),
    playerId,
  };
}

/**
 * 离开房间
 * @param roomId 房间 ID
 * @param playerId 玩家 ID
 * @returns 更新后的房间信息，或 null（房间已解散）
 */
export function leaveRoom(
  roomId: string,
  playerId: string
): RoomInfo | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  // 移除玩家
  room.players = room.players.filter((p) => p.id !== playerId);

  // 清除 socket 映射
  for (const [socketId, mapping] of socketToRoom.entries()) {
    if (mapping.playerId === playerId) {
      socketToRoom.delete(socketId);
      break;
    }
  }

  // 如果房间空了，删除房间
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }

  // 如果房主离开，转移房主
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  return toRoomInfo(room);
}

/**
 * 获取房间
 */
export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

/**
 * 获取房间信息
 */
export function getRoomInfo(roomId: string): RoomInfo | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return toRoomInfo(room);
}

/**
 * 通过 socketId 查找玩家所在的房间
 */
export function findRoomBySocketId(
  socketId: string
): { room: Room; playerId: string } | null {
  const mapping = socketToRoom.get(socketId);
  if (!mapping) return null;

  const room = rooms.get(mapping.roomId);
  if (!room) return null;

  return { room, playerId: mapping.playerId };
}

/**
 * 更新玩家的 socket 连接状态
 */
export function updatePlayerConnection(
  roomId: string,
  playerId: string,
  socketId: string,
  connected: boolean
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.connected = connected;
    if (connected) {
      // 更新 socketId（重连时可能变化）
      // 先清除旧的映射
      for (const [oldSocketId, mapping] of socketToRoom.entries()) {
        if (mapping.playerId === playerId) {
          socketToRoom.delete(oldSocketId);
          break;
        }
      }
      player.socketId = socketId;
      socketToRoom.set(socketId, { roomId, playerId });
    }
  }
}

/**
 * 更新房间的游戏状态
 */
export function updateGameState(
  roomId: string,
  gameState: GameState
): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState = gameState;
  }
}

/**
 * 标记游戏已开始
 */
export function markGameStarted(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameStarted = true;
  }
}

/**
 * 检查房间是否可以开始游戏
 */
export function canStartGame(roomId: string, playerId: string): string | null {
  const room = rooms.get(roomId);
  if (!room) return '房间不存在';
  if (room.hostId !== playerId) return '只有房主可以开始游戏';
  if (room.gameStarted) return '游戏已经开始';
  if (room.players.length < MIN_PLAYERS)
    return `至少需要 ${MIN_PLAYERS} 名玩家`;
  return null;
}

// ============================================================
// 重新开始投票管理
// ============================================================

/**
 * 发起重新开始请求（发起者自动投同意票）
 * @returns 错误信息或投票信息
 */
export function requestRestart(
  roomId: string,
  playerId: string
): { error: string } | { voteInfo: RestartVoteInfo } {
  const room = rooms.get(roomId);
  if (!room) return { error: '房间不存在' };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: '你不在该房间中' };

  if (room.restartRequestedBy) {
    return { error: '已有一个重新开始投票正在进行中' };
  }

  // 发起投票，发起者自动同意
  room.restartRequestedBy = playerId;
  room.restartVotes = new Set([playerId]);

  return {
    voteInfo: getRestartVoteInfo(room),
  };
}

/**
 * 玩家投票（同意或拒绝）
 * @returns 投票结果
 */
export function voteRestart(
  roomId: string,
  playerId: string,
  agree: boolean
): { error: string } | { rejected: true; rejectedBy: string; rejectedByName: string } | { approved: boolean; voteInfo: RestartVoteInfo } {
  const room = rooms.get(roomId);
  if (!room) return { error: '房间不存在' };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: '你不在该房间中' };

  if (!room.restartRequestedBy) {
    return { error: '当前没有重新开始投票' };
  }

  if (room.restartVotes.has(playerId)) {
    return { error: '你已经投过票了' };
  }

  if (!agree) {
    // 拒绝：清除投票状态
    const rejectedByName = player.name;
    clearRestartVotes(roomId);
    return { rejected: true, rejectedBy: playerId, rejectedByName };
  }

  // 同意
  room.restartVotes.add(playerId);

  const voteInfo = getRestartVoteInfo(room);
  const approved = room.restartVotes.size === room.players.length;

  return { approved, voteInfo };
}

/**
 * 检查是否所有玩家都同意重新开始
 */
export function isRestartApproved(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  return room.restartVotes.size === room.players.length;
}

/**
 * 清除重新开始投票状态
 */
export function clearRestartVotes(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.restartVotes = new Set();
    room.restartRequestedBy = null;
  }
}

/**
 * 重置房间游戏状态以开始新一局（保留玩家）
 */
export function resetForNewGame(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameStarted = false;
    room.gameState = null;
    room.restartVotes = new Set();
    room.restartRequestedBy = null;
  }
}

/**
 * 获取重新开始投票信息
 */
function getRestartVoteInfo(room: Room): RestartVoteInfo {
  const requester = room.players.find((p) => p.id === room.restartRequestedBy);
  return {
    requestedBy: room.restartRequestedBy || '',
    requestedByName: requester?.name || '未知玩家',
    votedPlayers: Array.from(room.restartVotes),
    totalPlayers: room.players.length,
  };
}

/**
 * 获取公开房间列表
 */
export function getPublicRoomList(): RoomListItem[] {
  const publicRooms: RoomListItem[] = [];
  for (const room of rooms.values()) {
    if (room.visibility === 'public') {
      publicRooms.push({
        roomId: room.id,
        hostName: room.players.find(p => p.id === room.hostId)?.name || '未知',
        playerCount: room.players.length,
        maxPlayers: MAX_PLAYERS,
        status: room.gameStarted ? 'playing' : 'waiting',
        createdAt: room.createdAt.toISOString(),
      });
    }
  }
  return publicRooms;
}

/**
 * 获取房主的 socketId
 */
export function getHostSocketId(roomId: string): string | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const host = room.players.find(p => p.id === room.hostId);
  return host?.socketId || null;
}

/**
 * 添加加入申请
 */
export function addJoinRequest(
  roomId: string,
  requestId: string,
  playerName: string,
  socketId: string
): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  if (room.visibility !== 'public') return { success: false, error: '该房间为私密房间，请使用房间号加入' };
  if (room.players.length >= MAX_PLAYERS) return { success: false, error: '房间已满' };
  if (room.gameStarted) return { success: false, error: '游戏已开始，无法加入' };

  for (const req of room.pendingRequests.values()) {
    if (req.socketId === socketId) {
      return { success: false, error: '你已经发送过加入申请' };
    }
  }

  room.pendingRequests.set(requestId, {
    requestId,
    playerName,
    socketId,
    timestamp: Date.now(),
  });
  return { success: true };
}

/**
 * 同意加入申请
 */
export function approveJoinRequest(
  roomId: string,
  requestId: string
): { success: boolean; playerId?: string; roomInfo?: RoomInfo; socketId?: string; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };

  const request = room.pendingRequests.get(requestId);
  if (!request) return { success: false, error: '申请不存在或已过期' };

  if (room.players.length >= MAX_PLAYERS) {
    room.pendingRequests.delete(requestId);
    return { success: false, error: '房间已满' };
  }

  const playerId = uuidv4();
  const player: RoomPlayer = {
    id: playerId,
    name: request.playerName,
    socketId: request.socketId,
    connected: true,
  };

  room.players.push(player);
  socketToRoom.set(request.socketId, { roomId, playerId });
  room.pendingRequests.delete(requestId);

  return {
    success: true,
    playerId,
    roomInfo: toRoomInfo(room),
    socketId: request.socketId,
  };
}

/**
 * 删除指定加入申请
 */
export function removeJoinRequest(
  roomId: string,
  requestId: string
): PendingRequest | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const request = room.pendingRequests.get(requestId);
  if (!request) return null;
  room.pendingRequests.delete(requestId);
  return request;
}

/**
 * 按 socketId 删除加入申请
 */
export function removeJoinRequestBySocketId(
  roomId: string,
  socketId: string
): PendingRequest | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.socketId === socketId) {
      room.pendingRequests.delete(reqId);
      return req;
    }
  }
  return null;
}

/**
 * 将 Room 转换为 RoomInfo（不暴露内部数据）
 */
function toRoomInfo(room: Room): RoomInfo {
  return {
    roomId: room.id,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    visibility: room.visibility,
  };
}
