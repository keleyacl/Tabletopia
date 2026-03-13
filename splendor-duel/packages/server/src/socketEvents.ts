// ============================================================
// 璀璨宝石·对决 - Socket 事件处理
// ============================================================

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameAction } from '@splendor/shared';
import { roomManager } from './roomManager';
import { handleGameAction } from './gameHandler';

export function setupSocketEvents(io: Server): void {
  // 断线计时器：reconnectToken -> timer，用于游戏进行中断线后的超时清理
  const disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

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
      const { room, reconnectToken } = roomManager.createRoom(socket.id, playerName, visibility);
      socket.join(room.id);
      socket.emit('room:created', {
        roomId: room.id,
        playerId: 0,
        reconnectToken,
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
        reconnectToken: result.reconnectToken,
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
          reconnectToken: result.reconnectToken,
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

    // ========================================
    // 连接管理
    // ========================================

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] 客户端断开: ${socket.id}`);

      const room = roomManager.getPlayerRoom(socket.id);

      if (room && room.gameState) {
        // 游戏进行中，标记为断线但不移除
        const disconnectResult = roomManager.markDisconnected(socket.id);
        if (disconnectResult) {
          const { roomId, playerName } = disconnectResult;

          // 通知其他玩家
          io.to(roomId).emit('game:playerDisconnected', {
            playerName,
          });

          // 获取该玩家的 reconnectToken 用于设置超时清理
          // 从 disconnectedPlayers 中查找
          let tokenForTimer: string | null = null;
          for (const [token, dp] of disconnectResult.room.disconnectedPlayers.entries()) {
            if (dp.originalSocketId === socket.id) {
              tokenForTimer = token;
              break;
            }
          }

          if (tokenForTimer) {
            // 60 秒后若未重连，清理玩家
            const timer = setTimeout(() => {
              const cleanupResult = roomManager.cleanupDisconnectedPlayer(tokenForTimer!);
              disconnectTimers.delete(tokenForTimer!);
              if (cleanupResult) {
                io.to(cleanupResult.roomId).emit('room:player_left');
                broadcastRoomList();
              }
            }, 60000);

            disconnectTimers.set(tokenForTimer, timer);
          }
        }
      } else {
        // 游戏未开始，直接移除玩家
        const result = roomManager.leaveRoom(socket.id);
        if (result) {
          io.to(result.roomId).emit('room:player_left');
        }
      }

      broadcastRoomList();
    });

    // 重连处理
    socket.on('game:reconnect', (data: { reconnectToken: string }, callback?: (response: unknown) => void) => {
      const { reconnectToken } = data;

      const result = roomManager.reconnectPlayer(socket.id, reconnectToken);
      if (!result.success) {
        const errorResponse = { success: false, error: result.error };
        if (callback) callback(errorResponse);
        else socket.emit('game:error', result.error);
        return;
      }

      const { roomId, room, playerIndex, playerName } = result;

      // 清除断线计时器
      const timer = disconnectTimers.get(reconnectToken);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(reconnectToken);
      }

      // 加入 Socket.IO 房间
      socket.join(roomId!);

      // 发送当前游戏状态
      const response = {
        success: true,
        roomId,
        playerIndex,
        roomInfo: roomManager.getRoomInfo(roomId!),
        gameState: room!.gameState,
      };

      if (callback) callback(response);
      else {
        socket.emit('game:state_update', room!.gameState!);
      }

      // 通知其他玩家重连成功
      socket.to(roomId!).emit('game:playerReconnected', {
        playerName,
      });

      console.log(`[Socket] 玩家 ${playerName} 重连到房间 ${roomId}`);
    });

    // 心跳
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
}
