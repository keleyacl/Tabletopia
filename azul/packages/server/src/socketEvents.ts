import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  findRoomBySocketId,
  updatePlayerConnection,
  getRoomInfo,
  getPublicRoomList,
  getHostSocketId,
  addJoinRequest,
  approveJoinRequest,
  removeJoinRequest,
  removeJoinRequestBySocketId,
} from './roomManager';
import {
  handleStartGame,
  handleTakeFromFactory,
  handleTakeFromCenter,
  handleRequestRestart,
  handleVoteRestart,
} from './gameHandler';

/**
 * 注册所有 Socket.IO 事件
 */
export function registerSocketEvents(io: Server): void {
  // 广播房间列表更新
  function broadcastRoomList() {
    const rooms = getPublicRoomList();
    io.emit('lobby:room_list', { rooms });
  }

  // 处理玩家离开房间
  function handlePlayerLeave(
    socket: Socket,
    roomId: string,
    playerId: string
  ): void {
    const updatedRoomInfo = leaveRoom(roomId, playerId);
    socket.leave(roomId);
    if (updatedRoomInfo) {
      io.to(roomId).emit('room:updated', {
        type: 'ROOM_UPDATED',
        roomInfo: updatedRoomInfo,
      });
    }
    broadcastRoomList();
    console.log(`[Room] 玩家 ${playerId} 离开房间 ${roomId}`);
  }

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] 客户端连接: ${socket.id}`);

    // ========================================
    // 房间事件
    // ========================================

    // 创建房间
    socket.on(
      'room:create',
      (data: { playerName: string; visibility?: string }, callback?: (response: unknown) => void) => {
        const { playerName } = data;

        if (!playerName || playerName.trim().length === 0) {
          const errorResponse = { success: false, error: '请输入玩家名称' };
          if (callback) callback(errorResponse);
          else socket.emit('room:error', { type: 'ERROR', message: '请输入玩家名称' });
          return;
        }

        const result = createRoom(playerName.trim(), socket.id, (data.visibility as any) || 'public');

        // 加入 Socket.IO 房间
        socket.join(result.roomInfo.roomId);

        const response = {
          success: true,
          type: 'ROOM_CREATED',
          roomInfo: result.roomInfo,
          playerId: result.playerId,
        };

        if (callback) callback(response);
        else socket.emit('room:created', response);

        broadcastRoomList();

        console.log(
          `[Room] 房间 ${result.roomInfo.roomId} 已创建，房主: ${playerName}`
        );
      }
    );

    // 加入房间
    socket.on(
      'room:join',
      (
        data: { roomId: string; playerName: string },
        callback?: (response: unknown) => void
      ) => {
        const { roomId, playerName } = data;

        if (!playerName || playerName.trim().length === 0) {
          const errorResponse = { success: false, error: '请输入玩家名称' };
          if (callback) callback(errorResponse);
          else socket.emit('room:error', { type: 'ERROR', message: '请输入玩家名称' });
          return;
        }

        if (!roomId || roomId.trim().length === 0) {
          const errorResponse = { success: false, error: '请输入房间号' };
          if (callback) callback(errorResponse);
          else socket.emit('room:error', { type: 'ERROR', message: '请输入房间号' });
          return;
        }

        const result = joinRoom(roomId.trim().toUpperCase(), playerName.trim(), socket.id);

        if ('error' in result) {
          const errorResponse = { success: false, error: result.error };
          if (callback) callback(errorResponse);
          else socket.emit('room:error', { type: 'ERROR', message: result.error });
          return;
        }

        // 加入 Socket.IO 房间
        socket.join(result.roomInfo.roomId);

        const response = {
          success: true,
          type: 'ROOM_JOINED',
          roomInfo: result.roomInfo,
          playerId: result.playerId,
        };

        if (callback) callback(response);
        else socket.emit('room:joined', response);

        // 通知房间内其他玩家
        socket.to(result.roomInfo.roomId).emit('room:updated', {
          type: 'ROOM_UPDATED',
          roomInfo: result.roomInfo,
        });

        broadcastRoomList();

        console.log(
          `[Room] ${playerName} 加入房间 ${result.roomInfo.roomId}`
        );
      }
    );

    // 离开房间
    socket.on('room:leave', (data: { roomId: string; playerId: string }) => {
      const { roomId, playerId } = data;
      handlePlayerLeave(socket, roomId, playerId);
    });

    // ========================================
    // 游戏事件
    // ========================================

    // 开始游戏
    socket.on(
      'game:start',
      (data: { roomId: string; playerId: string }) => {
        handleStartGame(io, socket, data);
      }
    );

    // 从工厂拿砖
    socket.on(
      'game:takeFromFactory',
      (data: {
        roomId: string;
        playerId: string;
        factoryIndex: number;
        color: string;
        targetLineIndex: number;
      }) => {
        handleTakeFromFactory(io, socket, {
          ...data,
          color: data.color as any,
        });
      }
    );

    // 从中心拿砖
    socket.on(
      'game:takeFromCenter',
      (data: {
        roomId: string;
        playerId: string;
        color: string;
        targetLineIndex: number;
      }) => {
        handleTakeFromCenter(io, socket, {
          ...data,
          color: data.color as any,
        });
      }
    );

    // 请求重新开始
    socket.on(
      'game:requestRestart',
      (data: { roomId: string; playerId: string }) => {
        handleRequestRestart(io, socket, data);
      }
    );

    // 重新开始投票
    socket.on(
      'game:voteRestart',
      (data: { roomId: string; playerId: string; agree: boolean }) => {
        handleVoteRestart(io, socket, data);
      }
    );

    // ========================================
    // 大厅事件
    // ========================================

    // 获取公开房间列表
    socket.on('lobby:list', () => {
      const rooms = getPublicRoomList();
      socket.emit('lobby:room_list', { rooms });
    });

    // 发送加入申请
    socket.on('lobby:join_request', (data: { roomId: string; name: string }) => {
      const requestId = uuidv4();
      const result = addJoinRequest(data.roomId, requestId, data.name, socket.id);

      if (!result.success) {
        socket.emit('room:error', { type: 'ERROR', message: result.error || '发送申请失败' });
        return;
      }

      const hostSocketId = getHostSocketId(data.roomId);
      if (hostSocketId) {
        io.to(hostSocketId).emit('lobby:join_request_received', {
          requestId,
          playerName: data.name,
          roomId: data.roomId,
          timestamp: Date.now(),
        });
      }
    });

    // 房主响应加入申请
    socket.on('lobby:join_response', (data: { requestId: string; approved: boolean }) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { room } = found;
      const hostSocketId = getHostSocketId(room.id);
      if (hostSocketId !== socket.id) {
        socket.emit('room:error', { type: 'ERROR', message: '只有房主可以审批加入申请' });
        return;
      }

      if (data.approved) {
        const result = approveJoinRequest(room.id, data.requestId);
        if (!result.success) {
          socket.emit('room:error', { type: 'ERROR', message: result.error || '审批失败' });
          return;
        }

        const approvedSocket = io.sockets.sockets.get(result.socketId!);
        if (approvedSocket) {
          approvedSocket.join(room.id);
        }

        io.to(result.socketId!).emit('lobby:join_approved', {
          roomInfo: result.roomInfo,
          playerId: result.playerId,
        });

        socket.to(room.id).emit('room:updated', {
          type: 'ROOM_UPDATED',
          roomInfo: result.roomInfo,
        });

        socket.emit('room:updated', {
          type: 'ROOM_UPDATED',
          roomInfo: result.roomInfo,
        });

        broadcastRoomList();
      } else {
        const request = removeJoinRequest(room.id, data.requestId);
        if (request) {
          io.to(request.socketId).emit('lobby:join_rejected', {
            roomId: room.id,
            reason: '房主拒绝了你的加入申请',
          });
        }
      }
    });

    // 取消加入申请
    socket.on('lobby:cancel_request', (data: { roomId: string }) => {
      const request = removeJoinRequestBySocketId(data.roomId, socket.id);
      if (request) {
        const hostSocketId = getHostSocketId(data.roomId);
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

    // 断线处理
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] 客户端断开: ${socket.id}, 原因: ${reason}`);

      const found = findRoomBySocketId(socket.id);
      if (found) {
        const { room, playerId } = found;
        const player = room.players.find((p) => p.id === playerId);

        if (room.gameStarted) {
          // 游戏进行中，标记为断线但不移除
          updatePlayerConnection(room.id, playerId, socket.id, false);

          // 通知其他玩家
          io.to(room.id).emit('game:playerDisconnected', {
            type: 'PLAYER_DISCONNECTED',
            playerId,
            playerName: player?.name || '未知玩家',
          });

          console.log(
            `[Room] ${player?.name} 在房间 ${room.id} 中断线（游戏进行中）`
          );
        } else {
          // 游戏未开始，直接移除玩家
          handlePlayerLeave(socket, room.id, playerId);
        }
      }
    });

    // 重连处理
    socket.on(
      'game:reconnect',
      (
        data: { roomId: string; playerId: string },
        callback?: (response: unknown) => void
      ) => {
        const { roomId, playerId } = data;

        const roomInfo = getRoomInfo(roomId);
        if (!roomInfo) {
          const errorResponse = { success: false, error: '房间不存在' };
          if (callback) callback(errorResponse);
          return;
        }

        // 检查玩家是否属于该房间
        const playerExists = roomInfo.players.some((p) => p.id === playerId);
        if (!playerExists) {
          const errorResponse = { success: false, error: '你不属于该房间' };
          if (callback) callback(errorResponse);
          return;
        }

        // 更新连接状态
        updatePlayerConnection(roomId, playerId, socket.id, true);
        socket.join(roomId);

        // 获取当前游戏状态
        const room = findRoomBySocketId(socket.id);
        const response = {
          success: true,
          roomInfo,
          gameState: room?.room.gameState
            ? {
                ...room.room.gameState,
                bag: [],
                discardPile: [],
              }
            : null,
        };

        if (callback) callback(response);

        // 通知其他玩家
        const playerName =
          roomInfo.players.find((p) => p.id === playerId)?.name || '未知玩家';
        socket.to(roomId).emit('game:playerReconnected', {
          type: 'PLAYER_RECONNECTED',
          playerId,
          playerName,
        });

        console.log(`[Room] ${playerName} 重连到房间 ${roomId}`);
      }
    );

    // 心跳
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
}
