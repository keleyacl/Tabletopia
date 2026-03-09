// ============================================================
// 璀璨宝石·对决 - Socket 事件处理
// ============================================================

import { Server, Socket } from 'socket.io';
import { GameAction } from '@splendor/shared';
import { roomManager } from './roomManager';
import { handleGameAction } from './gameHandler';

export function setupSocketEvents(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] 客户端连接: ${socket.id}`);

    // 创建房间
    socket.on('room:create', () => {
      const room = roomManager.createRoom(socket.id);
      socket.join(room.id);
      socket.emit('room:created', {
        roomId: room.id,
        playerId: 0,
      });
    });

    // 加入房间
    socket.on('room:join', ({ roomId }: { roomId: string }) => {
      const result = roomManager.joinRoom(roomId, socket.id);
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

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] 客户端断开: ${socket.id}`);
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        io.to(result.roomId).emit('room:player_left');
      }
    });
  });
}
