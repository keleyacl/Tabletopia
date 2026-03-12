// ============================================================
// 璀璨宝石·对决 - Socket.IO 客户端服务
// ============================================================

import { io, Socket } from 'socket.io-client';
import { GameState, GameAction, RoomListItem, RoomInfo } from '@splendor/shared';

function getSocketPath(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}socket.io`;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  /**
   * 连接到服务器
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      path: getSocketPath(),
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

    // 大厅事件监听
    this.socket.on('lobby:room_list', (data: { rooms: RoomListItem[] }) => {
      this.emit('lobby:room_list', data);
    });

    this.socket.on('lobby:join_request_received', (data: any) => {
      this.emit('lobby:join_request_received', data);
    });

    this.socket.on('lobby:join_approved', (data: any) => {
      this.emit('lobby:join_approved', data);
    });

    this.socket.on('lobby:join_rejected', (data: any) => {
      this.emit('lobby:join_rejected', data);
    });

    this.socket.on('lobby:request_cancelled', (data: any) => {
      this.emit('lobby:request_cancelled', data);
    });

    this.socket.on('room:created', (data: any) => {
      this.emit('room:created', data);
    });

    this.socket.on('room:joined', (data: any) => {
      this.emit('room:joined', data);
    });

    this.socket.on('room:error', (data: any) => {
      this.emit('room:error', data);
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
  createRoom(playerName: string = '玩家1', visibility: string = 'public'): void {
    this.socket?.emit('room:create', { playerName, visibility });
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string, playerName: string = '玩家2'): void {
    this.socket?.emit('room:join', { roomId, playerName });
  }

  /**
   * 发送游戏动作
   */
  sendAction(action: GameAction): void {
    this.socket?.emit('game:action', action);
  }

  // ========================================
  // 大厅操作
  // ========================================

  fetchRoomList(): void {
    this.socket?.emit('lobby:list');
  }

  sendJoinRequest(roomId: string, name: string): void {
    this.socket?.emit('lobby:join_request', { roomId, name });
  }

  cancelJoinRequest(roomId: string): void {
    this.socket?.emit('lobby:cancel_request', { roomId });
  }

  respondToJoinRequest(requestId: string, approved: boolean): void {
    this.socket?.emit('lobby:join_response', { requestId, approved });
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
