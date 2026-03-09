import { io, Socket } from 'socket.io-client';
import {
  RoomInfo,
  GameState,
  TileColor,
  RoundScoreDetail,
  FinalScoreDetail,
} from '@azul/shared';

// ============================================================
// Socket.IO 客户端封装
// ============================================================

type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();

  /**
   * 连接到服务器
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] 已连接:', this.socket?.id);
      this.emit('connectionChange', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 已断开:', reason);
      this.emit('connectionChange', false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接错误:', error.message);
    });

    // 注册所有已绑定的事件处理器
    for (const [event, handlers] of this.eventHandlers.entries()) {
      for (const handler of handlers) {
        this.socket.on(event, handler);
      }
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 监听事件
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: EventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * 触发本地事件（不通过 socket）
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  // ========================================
  // 房间操作
  // ========================================

  /**
   * 创建房间
   */
  createRoom(playerName: string): Promise<{
    success: boolean;
    roomInfo?: RoomInfo;
    playerId?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: '未连接到服务器' });
        return;
      }

      this.socket.emit(
        'room:create',
        { playerName },
        (response: any) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * 加入房间
   */
  joinRoom(
    roomId: string,
    playerName: string
  ): Promise<{
    success: boolean;
    roomInfo?: RoomInfo;
    playerId?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: '未连接到服务器' });
        return;
      }

      this.socket.emit(
        'room:join',
        { roomId, playerName },
        (response: any) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * 离开房间
   */
  leaveRoom(roomId: string, playerId: string): void {
    this.socket?.emit('room:leave', { roomId, playerId });
  }

  // ========================================
  // 游戏操作
  // ========================================

  /**
   * 开始游戏
   */
  startGame(roomId: string, playerId: string): void {
    this.socket?.emit('game:start', { roomId, playerId });
  }

  /**
   * 从工厂拿砖
   */
  takeFromFactory(
    roomId: string,
    playerId: string,
    factoryIndex: number,
    color: TileColor,
    targetLineIndex: number
  ): void {
    this.socket?.emit('game:takeFromFactory', {
      roomId,
      playerId,
      factoryIndex,
      color,
      targetLineIndex,
    });
  }

  /**
   * 从中心拿砖
   */
  takeFromCenter(
    roomId: string,
    playerId: string,
    color: TileColor,
    targetLineIndex: number
  ): void {
    this.socket?.emit('game:takeFromCenter', {
      roomId,
      playerId,
      color,
      targetLineIndex,
    });
  }

  /**
   * 重连
   */
  reconnect(
    roomId: string,
    playerId: string
  ): Promise<{
    success: boolean;
    roomInfo?: RoomInfo;
    gameState?: GameState | null;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: '未连接到服务器' });
        return;
      }

      this.socket.emit(
        'game:reconnect',
        { roomId, playerId },
        (response: any) => {
          resolve(response);
        }
      );
    });
  }
}

// 单例导出
export const socketService = new SocketService();
