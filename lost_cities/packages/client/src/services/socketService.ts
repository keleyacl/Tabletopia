// ============================================================
// 失落的城市 - WebSocket 客户端服务
// ============================================================

import type { ServerMessage } from '@lost-cities/shared';

type MessageHandler = (msg: ServerMessage) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private _connected = false;
  private _url = '';
  private _reconnecting = false;
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 10;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _manualDisconnect = false;

  /**
   * 连接到服务器
   */
  connect(url: string): void {
    // 如果是重连且 URL 相同，不关闭旧连接（已在 close 事件中处理）
    if (this.socket && this._url !== url) {
      this._manualDisconnect = true;
      this.socket.close();
    }
    this._url = url;
    this._connected = false;
    this._manualDisconnect = false;

    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      const wasReconnecting = this._reconnecting;
      this._connected = true;
      this._reconnecting = false;
      this._reconnectAttempts = 0;

      if (wasReconnecting) {
        // 重连成功，触发 reconnected 事件
        console.log('[WebSocket] 重连成功');
        this.emit({ type: '_internal:reconnected', payload: null } as any);
      }

      this.emit({ type: 'room:state', payload: null } as any); // 触发状态更新
    });

    ws.addEventListener('close', () => {
      this._connected = false;
      if (!this._manualDisconnect) {
        this.tryReconnect();
      }
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        for (const handler of this.handlers) {
          handler(msg);
        }
      } catch {
        // ignore invalid JSON
      }
    });

    this.socket = ws;
  }

  /**
   * 尝试自动重连（指数退避策略）
   */
  private tryReconnect(): void {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.log('[WebSocket] 已达到最大重连次数，停止重连');
      this._reconnecting = false;
      return;
    }

    this._reconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 5000);
    console.log(`[WebSocket] 将在 ${delay}ms 后尝试第 ${this._reconnectAttempts + 1} 次重连...`);

    this._reconnectTimer = setTimeout(() => {
      this._reconnectAttempts++;
      this.connect(this._url);
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this._manualDisconnect = true;
    this._reconnecting = false;
    this._reconnectAttempts = 0;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._connected = false;
  }

  /**
   * 发送消息
   */
  send(type: string, payload?: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type, payload }));
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * 触发内部事件
   */
  private emit(msg: ServerMessage): void {
    for (const handler of this.handlers) {
      handler(msg);
    }
  }

  get connected(): boolean {
    return this._connected;
  }

  get url(): string {
    return this._url;
  }

  get rawSocket(): WebSocket | null {
    return this.socket;
  }
}

// 单例导出
export const socketService = new SocketService();
