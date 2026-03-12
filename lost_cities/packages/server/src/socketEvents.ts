// ============================================================
// 失落的城市 - Socket 事件处理
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
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
  getPublicRoomList,
  addJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
} from './roomManager.js';

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
  /** 大厅 socket 跟踪：socket → socketId（用于加入申请通信） */
  const lobbySocketMap = new Map<WebSocket, string>();
  /** socketId → socket 反向映射 */
  const lobbySocketById = new Map<string, WebSocket>();

  function getRoom(code: unknown): Room | undefined {
    if (!code || typeof code !== 'string') return undefined;
    return rooms.get((code as string).toUpperCase());
  }

  /** 注册大厅 socket */
  function registerLobbySocket(socket: WebSocket): string {
    let socketId = lobbySocketMap.get(socket);
    if (!socketId) {
      socketId = nanoid();
      lobbySocketMap.set(socket, socketId);
      lobbySocketById.set(socketId, socket);
    }
    return socketId;
  }

  /** 清理大厅 socket */
  function unregisterLobbySocket(socket: WebSocket): void {
    const socketId = lobbySocketMap.get(socket);
    if (socketId) {
      lobbySocketById.delete(socketId);
      lobbySocketMap.delete(socket);
    }
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
        const visibility = payload?.visibility === 'public' ? 'public' : 'private';
        let room = createRoom(payload?.roundsTotal, visibility);
        while (rooms.has(room.code)) {
          room = createRoom(payload?.roundsTotal, visibility);
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
        room.hostId = player!.id;
        room.hostName = player!.name;
        socketToPlayer.set(socket, {
          roomCode: room.code,
          playerId: player!.id,
        });
        // 大厅 socket 不再需要跟踪（已加入房间）
        lobbySocketMap.delete(socket);
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
        unregisterLobbySocket(socket);
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

      // ============================================================
      // 大厅事件处理
      // ============================================================

      if (type === 'lobby:list') {
        const roomList = getPublicRoomList(rooms);
        send(socket, 'lobby:room_list', { rooms: roomList });
        return;
      }

      if (type === 'lobby:join_request') {
        const roomCode = String(payload?.roomCode ?? '').trim().toUpperCase();
        const playerName = String(payload?.name ?? '').trim() || 'Guest';
        const room = getRoom(roomCode);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const socketId = registerLobbySocket(socket);
        const requestId = nanoid();
        const result = addJoinRequest(room, requestId, playerName, socketId);
        if (!result.ok) {
          send(socket, 'error', { message: result.error });
          return;
        }
        // 通知房主
        const hostSocket = room.sockets.get(room.hostId);
        if (hostSocket) {
          send(hostSocket, 'lobby:join_request_received', {
            requestId,
            playerName,
            roomCode: room.code,
            timestamp: Date.now(),
          });
        }
        return;
      }

      if (type === 'lobby:join_response') {
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
        // 验证当前 socket 是房主
        if (meta.playerId !== room.hostId) {
          send(socket, 'error', { message: 'Only host can respond' });
          return;
        }
        const requestId = String(payload?.requestId ?? '');
        const approved = Boolean(payload?.approved);

        if (approved) {
          // 找到申请者的 socket
          const request = room.pendingRequests.get(requestId);
          if (!request) {
            send(socket, 'error', { message: 'Request not found' });
            return;
          }
          const requesterSocket = lobbySocketById.get(request.socketId);
          if (!requesterSocket || requesterSocket.readyState !== WebSocket.OPEN) {
            room.pendingRequests.delete(requestId);
            send(socket, 'error', { message: 'Requester disconnected' });
            return;
          }
          const result = approveJoinRequest(room, requestId, requesterSocket);
          if (!result.ok) {
            send(socket, 'error', { message: result.error });
            return;
          }
          // 通知申请者已被同意
          send(requesterSocket, 'lobby:join_approved', {
            roomCode: room.code,
            playerIndex: room.players.findIndex((p) => p.id === result.player!.id),
            reconnectToken: result.token,
          });
          // 将申请者注册到 socketToPlayer
          socketToPlayer.set(requesterSocket, {
            roomCode: room.code,
            playerId: result.player!.id,
          });
          // 清理大厅 socket
          unregisterLobbySocket(requesterSocket);
          // 发送 token 给申请者
          send(requesterSocket, 'room:token', { token: result.token });
          // 广播房间状态
          broadcastRoom(room);
        } else {
          const result = rejectJoinRequest(room, requestId);
          if (!result.ok) {
            send(socket, 'error', { message: result.error });
            return;
          }
          // 通知申请者被拒绝
          const requesterSocket = result.socketId
            ? lobbySocketById.get(result.socketId)
            : undefined;
          if (requesterSocket && requesterSocket.readyState === WebSocket.OPEN) {
            send(requesterSocket, 'lobby:join_rejected', {
              roomCode: room.code,
              reason: 'Host rejected your request',
            });
          }
        }
        return;
      }

      if (type === 'lobby:cancel_request') {
        const roomCode = String(payload?.roomCode ?? '').trim().toUpperCase();
        const room = getRoom(roomCode);
        if (!room) {
          send(socket, 'error', { message: 'Room not found' });
          return;
        }
        const socketId = lobbySocketMap.get(socket);
        if (!socketId) {
          send(socket, 'error', { message: 'No pending request' });
          return;
        }
        const result = cancelJoinRequest(room, socketId);
        if (!result.ok) {
          send(socket, 'error', { message: result.error });
          return;
        }
        // 通知房主申请已取消
        const hostSocket = room.sockets.get(room.hostId);
        if (hostSocket && hostSocket.readyState === WebSocket.OPEN) {
          send(hostSocket, 'lobby:request_cancelled', {
            requestId: result.requestId,
          });
        }
        return;
      }

      send(socket, 'error', { message: 'Unknown message type' });
    });

    socket.on('close', () => {
      // 清理大厅 socket 和相关的待处理申请
      const socketId = lobbySocketMap.get(socket);
      if (socketId) {
        // 清理该 socket 在所有房间中的待处理申请
        for (const room of rooms.values()) {
          const cancelResult = cancelJoinRequest(room, socketId);
          if (cancelResult.ok) {
            // 通知房主申请已取消
            const hostSocket = room.sockets.get(room.hostId);
            if (hostSocket && hostSocket.readyState === WebSocket.OPEN) {
              send(hostSocket, 'lobby:request_cancelled', {
                requestId: cancelResult.requestId,
              });
            }
          }
        }
        unregisterLobbySocket(socket);
      }

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
