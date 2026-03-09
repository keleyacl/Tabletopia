// ============================================================
// 璀璨宝石·对决 - 房间管理器
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { GameState } from '@splendor/shared';
import { createInitialState } from '@splendor/game-logic';

interface Room {
  id: string;
  players: string[]; // socket IDs
  gameState: GameState | null;
  createdAt: Date;
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * 创建新房间
   */
  createRoom(socketId: string): Room {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const room: Room = {
      id: roomId,
      players: [socketId],
      gameState: null,
      createdAt: new Date(),
    };
    this.rooms.set(roomId, room);
    this.playerToRoom.set(socketId, roomId);
    console.log(`[Room] 创建房间 ${roomId}，玩家: ${socketId}`);
    return room;
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string, socketId: string): { success: boolean; room?: Room; error?: string } {
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

    room.players.push(socketId);
    this.playerToRoom.set(socketId, roomId);
    console.log(`[Room] 玩家 ${socketId} 加入房间 ${roomId}`);

    // 两人齐了，开始游戏
    if (room.players.length === 2) {
      room.gameState = createInitialState();
      console.log(`[Room] 房间 ${roomId} 游戏开始`);
    }

    return { success: true, room };
  }

  /**
   * 玩家离开
   */
  leaveRoom(socketId: string): { roomId: string; room: Room } | null {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((id) => id !== socketId);
    this.playerToRoom.delete(socketId);
    console.log(`[Room] 玩家 ${socketId} 离开房间 ${roomId}`);

    // 如果房间空了，删除房间
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[Room] 房间 ${roomId} 已删除`);
    }

    return { roomId, room };
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
}

export const roomManager = new RoomManager();
