// ============================================================
// 璀璨宝石·对决 - 房间管理器
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { GameState, RoomVisibility, RoomListItem, RoomInfo } from '@splendor/shared';
import { createInitialState } from '@splendor/game-logic';

interface PendingRequest {
  requestId: string;
  playerName: string;
  socketId: string;
  timestamp: number;
}

interface DisconnectedPlayer {
  originalSocketId: string;
  playerName: string;
  playerIndex: 0 | 1;
  disconnectedAt: number;
}

interface Room {
  id: string;
  players: string[]; // socket IDs
  playerNames: Map<string, string>; // socketId -> playerName
  hostSocketId: string;
  gameState: GameState | null;
  createdAt: Date;
  visibility: RoomVisibility;
  pendingRequests: Map<string, PendingRequest>;
  // 断线重连相关
  reconnectTokens: Map<string, string>; // socketId -> reconnectToken
  disconnectedPlayers: Map<string, DisconnectedPlayer>; // reconnectToken -> 断线玩家信息
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * 创建新房间
   */
  createRoom(socketId: string, playerName: string = '玩家1', visibility: RoomVisibility = 'public'): { room: Room; reconnectToken: string } {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const reconnectToken = uuidv4();
    const room: Room = {
      id: roomId,
      players: [socketId],
      playerNames: new Map([[socketId, playerName]]),
      hostSocketId: socketId,
      gameState: null,
      createdAt: new Date(),
      visibility,
      pendingRequests: new Map(),
      reconnectTokens: new Map([[socketId, reconnectToken]]),
      disconnectedPlayers: new Map(),
    };
    this.rooms.set(roomId, room);
    this.playerToRoom.set(socketId, roomId);
    console.log(`[Room] 创建房间 ${roomId}，玩家: ${playerName}`);
    return { room, reconnectToken };
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string, socketId: string, playerName: string = '玩家2'): { success: boolean; room?: Room; reconnectToken?: string; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    if (room.players.length >= 2) {
      return { success: false, error: '房间已满' };
    }
    if (room.players.includes(socketId)) {
      return { success: false, error: '你已在此房间中' };
    }

    const reconnectToken = uuidv4();
    room.players.push(socketId);
    room.playerNames.set(socketId, playerName);
    room.reconnectTokens.set(socketId, reconnectToken);
    this.playerToRoom.set(socketId, roomId);
    console.log(`[Room] 玩家 ${playerName} 加入房间 ${roomId}`);

    // 两人齐了，开始游戏
    if (room.players.length === 2) {
      room.gameState = createInitialState();
      console.log(`[Room] 房间 ${roomId} 游戏开始`);
    }

    return { success: true, room, reconnectToken };
  }

  /**
   * 玩家离开（仅在游戏未开始或超时清理时调用）
   */
  leaveRoom(socketId: string): { roomId: string; room: Room } | null {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((id) => id !== socketId);
    room.playerNames.delete(socketId);
    room.reconnectTokens.delete(socketId);
    this.playerToRoom.delete(socketId);
    console.log(`[Room] 玩家 ${socketId} 离开房间 ${roomId}`);

    // 如果房间空了（包括没有断线玩家），删除房间
    if (room.players.length === 0 && room.disconnectedPlayers.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[Room] 房间 ${roomId} 已删除`);
    }

    return { roomId, room };
  }

  /**
   * 标记玩家断线（游戏进行中使用，不移除玩家数据）
   */
  markDisconnected(socketId: string): { roomId: string; room: Room; playerName: string; playerIndex: 0 | 1 } | null {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerIndex = room.players.indexOf(socketId);
    if (playerIndex === -1) return null;

    const playerName = room.playerNames.get(socketId) || '未知玩家';
    const reconnectToken = room.reconnectTokens.get(socketId);

    if (reconnectToken) {
      // 保存断线玩家信息，用于重连时恢复
      room.disconnectedPlayers.set(reconnectToken, {
        originalSocketId: socketId,
        playerName,
        playerIndex: playerIndex as 0 | 1,
        disconnectedAt: Date.now(),
      });
    }

    // 从活跃玩家列表中移除，但保留 playerNames 和 reconnectTokens 以便重连
    room.players = room.players.filter((id) => id !== socketId);
    this.playerToRoom.delete(socketId);

    console.log(`[Room] 玩家 ${playerName} 在房间 ${roomId} 中断线（游戏进行中）`);

    return { roomId, room, playerName, playerIndex: playerIndex as 0 | 1 };
  }

  /**
   * 玩家重连
   */
  reconnectPlayer(newSocketId: string, reconnectToken: string): {
    success: boolean;
    roomId?: string;
    room?: Room;
    playerIndex?: 0 | 1;
    playerName?: string;
    error?: string;
  } {
    // 在所有房间中查找匹配的 reconnectToken
    for (const [roomId, room] of this.rooms.entries()) {
      const disconnectedPlayer = room.disconnectedPlayers.get(reconnectToken);
      if (!disconnectedPlayer) continue;

      const { originalSocketId, playerName, playerIndex } = disconnectedPlayer;

      // 恢复玩家到活跃列表
      // 确保在正确的位置插入，保持 playerIndex 不变
      if (playerIndex === 0) {
        room.players.unshift(newSocketId);
      } else {
        room.players.push(newSocketId);
      }

      // 更新映射：旧 socketId -> 新 socketId
      room.playerNames.delete(originalSocketId);
      room.playerNames.set(newSocketId, playerName);
      room.reconnectTokens.delete(originalSocketId);
      room.reconnectTokens.set(newSocketId, reconnectToken);
      this.playerToRoom.set(newSocketId, roomId);

      // 清除断线记录
      room.disconnectedPlayers.delete(reconnectToken);

      console.log(`[Room] 玩家 ${playerName} 重连到房间 ${roomId}`);

      return {
        success: true,
        roomId,
        room,
        playerIndex,
        playerName,
      };
    }

    return { success: false, error: '无效的重连令牌或已超时' };
  }

  /**
   * 清理超时断线玩家（由 socketEvents 的定时器调用）
   */
  cleanupDisconnectedPlayer(reconnectToken: string): { roomId: string; room: Room } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const disconnectedPlayer = room.disconnectedPlayers.get(reconnectToken);
      if (!disconnectedPlayer) continue;

      const { originalSocketId, playerName } = disconnectedPlayer;

      // 清理断线玩家数据
      room.disconnectedPlayers.delete(reconnectToken);
      room.playerNames.delete(originalSocketId);
      room.reconnectTokens.delete(originalSocketId);

      console.log(`[Room] 玩家 ${playerName} 断线超时，已清理`);

      // 如果房间空了（没有活跃玩家也没有断线玩家），删除房间
      if (room.players.length === 0 && room.disconnectedPlayers.size === 0) {
        this.rooms.delete(roomId);
        console.log(`[Room] 房间 ${roomId} 已删除`);
      }

      return { roomId, room };
    }

    return null;
  }

  /**
   * 获取玩家所在的房间
   */
  getPlayerRoom(socketId: string): Room | null {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * 获取玩家在房间中的索引（0 或 1）
   */
  getPlayerIndex(socketId: string): 0 | 1 | null {
    const room = this.getPlayerRoom(socketId);
    if (!room) return null;
    const idx = room.players.indexOf(socketId);
    if (idx === -1) return null;
    return idx as 0 | 1;
  }

  /**
   * 获取房间
   */
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * 获取所有房间
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 获取公开房间列表
   */
  getPublicRoomList(): RoomListItem[] {
    const publicRooms: RoomListItem[] = [];
    for (const room of this.rooms.values()) {
      if (room.visibility === 'public') {
        publicRooms.push({
          roomId: room.id,
          hostName: room.playerNames.get(room.hostSocketId) || '未知',
          playerCount: room.players.length,
          maxPlayers: 2,
          status: room.gameState ? 'playing' : 'waiting',
          createdAt: room.createdAt.toISOString(),
        });
      }
    }
    return publicRooms;
  }

  /**
   * 获取房主的 socketId
   */
  getHostSocketId(roomId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.hostSocketId;
  }

  /**
   * 添加加入申请
   */
  addJoinRequest(
    roomId: string,
    requestId: string,
    playerName: string,
    socketId: string
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.visibility !== 'public') return { success: false, error: '该房间为私密房间' };
    if (room.players.length >= 2) return { success: false, error: '房间已满' };
    if (room.gameState) return { success: false, error: '游戏已开始，无法加入' };

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
  approveJoinRequest(
    roomId: string,
    requestId: string
  ): { success: boolean; room?: Room; socketId?: string; playerIndex?: 0 | 1; reconnectToken?: string; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };

    const request = room.pendingRequests.get(requestId);
    if (!request) return { success: false, error: '申请不存在或已过期' };

    if (room.players.length >= 2) {
      room.pendingRequests.delete(requestId);
      return { success: false, error: '房间已满' };
    }

    const reconnectToken = uuidv4();
    room.players.push(request.socketId);
    room.playerNames.set(request.socketId, request.playerName);
    room.reconnectTokens.set(request.socketId, reconnectToken);
    this.playerToRoom.set(request.socketId, roomId);
    room.pendingRequests.delete(requestId);

    const playerIndex = (room.players.indexOf(request.socketId)) as 0 | 1;

    if (room.players.length === 2) {
      room.gameState = createInitialState();
      console.log(`[Room] 房间 ${roomId} 游戏开始`);
    }

    return {
      success: true,
      room,
      socketId: request.socketId,
      playerIndex,
      reconnectToken,
    };
  }

  /**
   * 删除指定加入申请
   */
  removeJoinRequest(roomId: string, requestId: string): PendingRequest | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const request = room.pendingRequests.get(requestId);
    if (!request) return null;
    room.pendingRequests.delete(requestId);
    return request;
  }

  /**
   * 按 socketId 删除加入申请
   */
  removeJoinRequestBySocketId(roomId: string, socketId: string): PendingRequest | null {
    const room = this.rooms.get(roomId);
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
   * 获取房间信息（用于客户端展示）
   */
  getRoomInfo(roomId: string): RoomInfo | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      roomId: room.id,
      players: room.players.map((socketId, index) => ({
        id: index as 0 | 1,
        name: room.playerNames.get(socketId) || `玩家${index + 1}`,
      })),
      hostId: 0,
      gameStarted: room.gameState !== null,
      visibility: room.visibility,
    };
  }
}

export const roomManager = new RoomManager();
