// ============================================================
// 斋浦尔 - 房间管理器
// ============================================================

import { nanoid } from 'nanoid';
import { GameState } from '@jaipur/shared';

interface RoomPlayer {
  name: string;
  playerIndex: 0 | 1;
  reconnectToken: string;
}

interface Room {
  roomCode: string;
  players: Map<string, RoomPlayer>;
  gameState: GameState | null;
  createdAt: Date;
  matchFinished: boolean;
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketIdToRoomCode: Map<string, string> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 生成 4 位大写字母数字房间码
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆的字符
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 确保房间码唯一
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  /**
   * 创建房间
   */
  createRoom(socketId: string, name: string): { roomCode: string; reconnectToken: string } {
    const roomCode = this.generateRoomCode();
    const reconnectToken = nanoid();
    const playerIndex: 0 | 1 = 0;

    const room: Room = {
      roomCode,
      players: new Map([
        [
          socketId,
          {
            name,
            playerIndex,
            reconnectToken,
          },
        ],
      ]),
      gameState: null,
      createdAt: new Date(),
      matchFinished: false,
    };

    this.rooms.set(roomCode, room);
    this.socketIdToRoomCode.set(socketId, roomCode);
    console.log(`[Room] 创建房间 ${roomCode}，玩家: ${name} (${socketId})`);

    return { roomCode, reconnectToken };
  }

  /**
   * 加入房间
   */
  joinRoom(socketId: string, name: string, roomCode: string): {
    success: boolean;
    playerIndex?: 0 | 1;
    reconnectToken?: string;
    error?: string;
  } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    if (room.players.size >= 2) {
      return { success: false, error: '房间已满' };
    }

    const reconnectToken = nanoid();
    const playerIndex: 0 | 1 = room.players.size === 0 ? 0 : 1;

    room.players.set(socketId, {
      name,
      playerIndex,
      reconnectToken,
    });

    this.socketIdToRoomCode.set(socketId, roomCode);
    console.log(`[Room] 玩家 ${name} (${socketId}) 加入房间 ${roomCode}`);

    return { success: true, playerIndex, reconnectToken };
  }

  /**
   * 重连
   */
  reconnect(socketId: string, reconnectToken: string): {
    success: boolean;
    roomCode?: string;
    playerIndex?: 0 | 1;
    error?: string;
  } {
    // 查找包含此 reconnectToken 的玩家
    for (const [roomCode, room] of this.rooms.entries()) {
      for (const [oldSocketId, player] of room.players.entries()) {
        if (player.reconnectToken === reconnectToken) {
          // 清除旧的断线计时器
          const timer = this.disconnectTimers.get(oldSocketId);
          if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(oldSocketId);
          }

          // 更新 socketId
          room.players.delete(oldSocketId);
          room.players.set(socketId, player);
          this.socketIdToRoomCode.delete(oldSocketId);
          this.socketIdToRoomCode.set(socketId, roomCode);

          console.log(`[Room] 玩家 ${player.name} 重连成功 (${oldSocketId} -> ${socketId})`);
          return { success: true, roomCode, playerIndex: player.playerIndex };
        }
      }
    }

    return { success: false, error: '无效的重连令牌' };
  }

  /**
   * 获取房间
   */
  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * 通过 socketId 查找房间
   */
  getRoomBySocketId(socketId: string): Room | null {
    const roomCode = this.socketIdToRoomCode.get(socketId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  /**
   * 获取玩家在房间中的信息
   */
  getPlayer(socketId: string): RoomPlayer | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;
    return room.players.get(socketId) || null;
  }

  /**
   * 标记玩家断线
   */
  removeDisconnectedPlayer(socketId: string): { roomCode: string; room: Room } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (!player) return null;

    // 设置 60 秒后清理
    const timer = setTimeout(() => {
      console.log(`[Room] 清理超时断线玩家 ${player.name} (${socketId})`);
      room.players.delete(socketId);
      this.socketIdToRoomCode.delete(socketId);

      // 如果房间空了，删除房间
      if (room.players.size === 0) {
        this.rooms.delete(room.roomCode);
        console.log(`[Room] 房间 ${room.roomCode} 已删除`);
      }
    }, 60000);

    this.disconnectTimers.set(socketId, timer);
    console.log(`[Room] 玩家 ${player.name} 断线，60秒后清理`);

    return { roomCode: room.roomCode, room };
  }

  /**
   * 重置游戏状态（用于 rematch）
   * 清除 gameState 但保留房间和玩家信息
   */
  resetGameState(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.gameState = null;
    room.matchFinished = false;
    return true;
  }

  /**
   * 获取所有房间
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

export const roomManager = new RoomManager();
