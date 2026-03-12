// ============================================================
// 斋浦尔 - Socket.IO 客户端服务
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@jaipur/shared';

function getSocketPath(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}socket.io/`;
}

class SocketService {
  private socket: Socket<ClientToServerEvents, ServerToClientEvents> | null = null;

  /**
   * 初始化 socket 实例（不立即连接）
   * 允许先注册事件监听器，再调用 connect() 建立连接
   */
  init(): Socket<ClientToServerEvents, ServerToClientEvents> {
    if (this.socket) return this.socket;

    this.socket = io(window.location.origin, {
      path: getSocketPath(),
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    return this.socket;
  }

  /**
   * 连接到服务器（需先调用 init()）
   */
  connect(): void {
    if (!this.socket) {
      this.init();
    }
    if (this.socket?.connected) return;
    this.socket!.connect();
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
