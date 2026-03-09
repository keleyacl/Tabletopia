// ============================================================
// 斋浦尔 - Socket.IO 客户端服务
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@jaipur/shared';

class SocketService {
  private socket: Socket<ClientToServerEvents, ServerToClientEvents> | null = null;

  /**
   * 连接到服务器
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3007', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    this.socket.connect();
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
   * 注册事件监听（类型安全）
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    // 使用类型断言来解决Socket.IO类型限制
    (this.socket as any)?.on(event, callback);
  }

  /**
   * 发送事件（类型安全）
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    // 使用类型断言来解决Socket.IO类型限制
    (this.socket as any)?.emit(event, ...args);
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

export const socketService = new SocketService();