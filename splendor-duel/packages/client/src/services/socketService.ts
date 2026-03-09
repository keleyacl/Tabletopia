// ============================================================
// 璀璨宝石·对决 - Socket.IO 客户端服务
// ============================================================

import { io, Socket } from 'socket.io-client';
import { GameState, GameAction } from '@splendor/shared';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  /**
   * 连接到服务器
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] 已连接:', this.socket?.id);
      this.emit('_internal_connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 已断开:', reason);
      this.emit('_internal_disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接错误:', error.message);
      this.emit('_internal_error', error.message);
    });

    // 游戏事件监听
    this.socket.on('game:state_update', (state: GameState) => {
      this.emit('game:state_update', state);
    });

    this.socket.on('game:error', (error: string) => {
      this.emit('game:error', error);
    });

    this.socket.on('room:player_joined', (data: { playerId: 0 | 1 }) => {
      this.emit('room:player_joined', data);
    });

    this.socket.on('room:player_left', () => {
      this.emit('room:player_left');
    });

    this.socket.on('room:game_started', (state: GameState) => {
      this.emit('room:game_started', state);
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * 创建房间
   */
  createRoom(): void {
    this.socket?.emit('room:create');
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string): void {
    this.socket?.emit('room:join', { roomId });
  }

  /**
   * 发送游戏动作
   */
  sendAction(action: GameAction): void {
    this.socket?.emit('game:action', action);
  }

  /**
   * 注册事件监听
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 返回取消监听函数
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * 触发内部事件
   */
  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }

  /**
   * 获取连接状态
   */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * 获取 socket ID
   */
  get id(): string | undefined {
    return this.socket?.id;
  }
}

// 单例导出
export const socketService = new SocketService();
