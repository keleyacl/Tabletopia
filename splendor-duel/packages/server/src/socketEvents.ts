// ============================================================
// 璀璨宝石·对决 - Socket 事件处理
// ============================================================

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameAction } from '@splendor/shared';
import { roomManager } from './roomManager';
import { handleGameAction } from './gameHandler';

export function setupSocketEvents(io: Server): void {
  function broadcastRoomList() {
    const rooms = roomManager.getPublicRoomList();
    io.emit('lobby:room_list', { rooms });
  }

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] 客户端连接: ${socket.id}`);

    // 创建房间
    socket.on('room:create', (data?: { playerName?: string; visibility?: string }) => {
      const playerName = data?.playerName || '玩家1';
      const visibility = (data?.visibility as any) || 'public';
      const room = roomManager.createRoom(socket.id, playerName, visibility);
      socket.join(room.id);
      socket.emit('room:created', {
        roomId: room.id,
        playerId: 0,
        roomInfo: roomManager.getRoomInfo(room.id),
      });
      broadcastRoomList();
    });

    // 加入房间
    socket.on('room:join', ({ roomId, playerName }: { roomId: string; playerName?: string }) => {
      const result = roomManager.joinRoom(roomId, socket.id, playerName || '玩家2');
      if (!result.success) {
        socket.emit('room:error', { error: result.error });
        return;
      }

      const room = result.room!;
      socket.join(roomId);

      // 通知加入者
      socket.emit('room:joined', {
        roomId: room.id,
        playerId: 1,
      });

      // 通知房间内所有人
      io.to(roomId).emit('room:player_joined', {
        playerId: room.players.indexOf(socket.id),
      });

      // 如果游戏已开始，广播初始状态
      if (room.gameState) {
        io.to(roomId).emit('room:game_started', room.gameState);
        io.to(roomId).emit('game:state_update', room.gameState);
      }

      broadcastRoomList();
    });

    // 游戏动作
    socket.on('game:action', (action: GameAction) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room || !room.gameState) {
        socket.emit('game:error', '游戏未开始');
        return;
      }

      const playerIndex = roomManager.getPlayerIndex(socket.id);
      if (playerIndex === null) {
        socket.emit('game:error', '你不在此游戏中');
        return;
      }

      const result = handleGameAction(room.gameState, action, playerIndex);
      if (!result.success) {
        socket.emit('game:error', result.error);
        return;
      }

      // 广播更新后的状态
      io.to(room.id).emit('game:state_update', room.gameState);
    });

    // ========================================
    // 大厅事件
    // ========================================

    socket.on('lobby:list', () => {
      const rooms = roomManager.getPublicRoomList();
      socket.emit('lobby:room_list', { rooms });
    });

    socket.on('lobby:join_request', (data: { roomId: string; name: string }) => {
      const requestId = uuidv4();
      const result = roomManager.addJoinRequest(data.roomId, requestId, data.name, socket.id);

      if (!result.success) {
        socket.emit('room:error', { error: result.error || '发送申请失败' });
        return;
      }

      const hostSocketId = roomManager.getHostSocketId(data.roomId);
      if (hostSocketId) {
        io.to(hostSocketId).emit('lobby:join_request_received', {
          requestId,
          playerName: data.name,
          roomId: data.roomId,
          timestamp: Date.now(),
        });
      }
    });

    socket.on('lobby:join_response', (data: { requestId: string; approved: boolean }) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;

      const hostSocketId = roomManager.getHostSocketId(room.id);
      if (hostSocketId !== socket.id) {
        socket.emit('room:error', { error: '只有房主可以审批加入申请' });
        return;
      }

      if (data.approved) {
        const result = roomManager.approveJoinRequest(room.id, data.requestId);
        if (!result.success) {
          socket.emit('room:error', { error: result.error || '审批失败' });
          return;
        }

        const approvedSocket = io.sockets.sockets.get(result.socketId!);
        if (approvedSocket) {
          approvedSocket.join(room.id);
        }

        io.to(result.socketId!).emit('lobby:join_approved', {
          roomId: room.id,
          playerId: result.playerIndex,
          roomInfo: roomManager.getRoomInfo(room.id),
        });

        io.to(room.id).emit('room:player_joined', {
          playerId: result.playerIndex,
        });

        if (room.gameState) {
          io.to(room.id).emit('room:game_started', room.gameState);
          io.to(room.id).emit('game:state_update', room.gameState);
        }

        broadcastRoomList();
      } else {
        const request = roomManager.removeJoinRequest(room.id, data.requestId);
        if (request) {
          io.to(request.socketId).emit('lobby:join_rejected', {
            roomId: room.id,
            reason: '房主拒绝了你的加入申请',
          });
        }
      }
    });

    socket.on('lobby:cancel_request', (data: { roomId: string }) => {
      const request = roomManager.removeJoinRequestBySocketId(data.roomId, socket.id);
      if (request) {
        const hostSocketId = roomManager.getHostSocketId(data.roomId);
        if (hostSocketId) {
          io.to(hostSocketId).emit('lobby:request_cancelled', {
            requestId: request.requestId,
          });
        }
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] 客户端断开: ${socket.id}`);
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        io.to(result.roomId).emit('room:player_left');
      }
      broadcastRoomList();
    });
  });
}
