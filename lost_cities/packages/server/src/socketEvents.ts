// ============================================================
// 失落的城市 - Socket 事件处理
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import { RECONNECT_TTL_MS } from '@lost-cities/shared';
import {
  Room,
  createRoom,
  addPlayer,
  removePlayer,
  roomStateFor,
  gameStateFor,
  handleAction,
  reconnectPlayer,
  pruneRoom,
  restartRoom,
} from './roomManager';

/** 向单个 socket 发送消息 */
function send(socket: WebSocket, type: string, payload: unknown): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

/** 向房间内所有在线玩家广播房间和游戏状态 */
function broadcastRoom(room: Room): void {
  for (const player of room.players) {
    const socket = room.sockets.get(player.id);
    if (!socket || socket.readyState !== WebSocket.OPEN) continue;
    send(socket, 'room:state', roomStateFor(room, player.id));
    send(socket, 'game:state', gameStateFor(room, player.id));
  }
}

/** 向房间内所有在线玩家广播事件 */
function broadcastEvent(room: Room, type: string, payload: unknown): void {
  for (const player of room.players) {
    const socket = room.sockets.get(player.id);
    if (!socket || socket.readyState !== WebSocket.OPEN) continue;
    send(socket, type, payload);
  }
}

/**
 * 设置 WebSocket 事件处理
 */
export function setupSocketEvents(wss: WebSocketServer): void {
  const rooms = new Map<string, Room>();
  const socketToPlayer = new Map<WebSocket, { roomCode: string; playerId: string }>();

  function getRoom(code: unknown): Room | undefined {
    if (!code || typeof code !== 'string') return undefined;
    return rooms.get((code as string).toUpperCase());
  }

  wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw: Buffer | string) => {
      let msg: any;
      try {
        msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
      } catch {
        send(socket, 'error', { message: 'Invalid JSON' });
        return;
      }

      const { type, payload } = msg || {};

      if (type === 'room:create') {
        let room = createRoom(payload?.roundsTotal);
        while (rooms.has(room.code)) {
          room = createRoom(payload?.roundsTotal);
        }
        rooms.set(room.code, room);
        const { ok, player, token, error } = addPlayer(
          room,
          socket,
          payload?.name
        );
        if (!ok) {
          send(socket, 'error', { message: error });
          return;
        }
        socketToPlayer.set(socket, {
          roomCode: room.code,
          playerId: player!.id,
        });
        send(socket, 'room:token', { token });
        broadcastRoom(room);
        return;
      }

      if (type === 'room:join') {
        const room = getRoom(payload?.code);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const { ok, player, token, error } = addPlayer(
          room,
          socket,
          payload?.name
        );
        if (!ok) {
          send(socket, 'error', { message: error });
          return;
        }
        socketToPlayer.set(socket, {
          roomCode: room.code,
          playerId: player!.id,
        });
        send(socket, 'room:token', { token });
        broadcastRoom(room);
        return;
      }

      if (type === 'room:reconnect') {
        const room = getRoom(payload?.code);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const result = reconnectPlayer(room, socket, payload?.token);
        if (!result.ok) {
          send(socket, 'error', { message: result.error });
          return;
        }
        socketToPlayer.set(socket, {
          roomCode: room.code,
          playerId: result.playerId!,
        });
        broadcastRoom(room);
        return;
      }

      if (type === 'game:action') {
        const meta = socketToPlayer.get(socket);
        if (!meta) {
          send(socket, 'error', { message: 'Not in room' });
          return;
        }
        const room = getRoom(meta.roomCode);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const result = handleAction(room, meta.playerId, payload);
        if (!result.ok) {
          send(socket, 'error', { message: result.error });
          return;
        }
        broadcastRoom(room);
        return;
      }

      if (type === 'game:restart') {
        const meta = socketToPlayer.get(socket);
        if (!meta) {
          send(socket, 'error', { message: 'Not in room' });
          return;
        }
        const room = getRoom(meta.roomCode);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const result = restartRoom(room);
        if (!result.ok) {
          send(socket, 'error', {
            message: result.error || 'Failed to restart',
          });
          return;
        }
        broadcastRoom(room);
        return;
      }

      if (type === 'room:chat') {
        const meta = socketToPlayer.get(socket);
        if (!meta) {
          send(socket, 'error', { message: 'Not in room' });
          return;
        }
        const room = getRoom(meta.roomCode);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const player = room.players.find((p) => p.id === meta.playerId);
        if (!player) {
          send(socket, 'error', { message: 'Unknown player' });
          return;
        }
        const text = String(payload?.text ?? '')
          .trim()
          .slice(0, 120);
        if (!text) {
          send(socket, 'error', { message: 'Empty chat message' });
          return;
        }
        broadcastEvent(room, 'room:chat', {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          senderId: player.id,
          senderName: player.name || 'Guest',
          text,
          at: Date.now(),
        });
        return;
      }

      send(socket, 'error', { message: 'Unknown message type' });
    });

    socket.on('close', () => {
      const meta = socketToPlayer.get(socket);
      if (!meta) return;
      const room = getRoom(meta.roomCode);
      if (!room) return;
      removePlayer(room, meta.playerId);
      socketToPlayer.delete(socket);
      pruneRoom(room, RECONNECT_TTL_MS);
      if (room.players.length === 0) {
        rooms.delete(meta.roomCode);
      } else {
        broadcastRoom(room);
      }
    });
  });
}
