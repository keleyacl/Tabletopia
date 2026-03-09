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

  /**
   * 连接到服务器
   */
  connect(url: string): void {
    if (this.socket) {
      this.socket.close();
    }
    this._url = url;
    this._connected = false;

    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      this._connected = true;
      this.emit({ type: 'room:state', payload: null } as any); // 触发状态更新
    });

    ws.addEventListener('close', () => {
      this._connected = false;
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
   * 断开连接
   */
  disconnect(): void {
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
