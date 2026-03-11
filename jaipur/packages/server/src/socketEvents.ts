// ============================================================
// 斋浦尔 - Socket 事件处理
// ============================================================

import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import type {
  GameAction,
  PlayerView,
  ChatMessage,
  RoundResult,
  RoomVisibility,
  RoomListItem,
  JoinRequest,
} from '@jaipur/shared';
import { initializeGame, initializeNewRound, getPlayerView } from '@jaipur/game-logic';
import { roomManager } from './roomManager';
import { handleGameAction } from './gameHandler';

// Socket 服务端事件类型（简化版，避免与 shared 的严格类型冲突）
interface ServerEvents {
  'room:created': (data: { roomCode: string; playerIndex: 0 | 1; reconnectToken: string }) => void;
  'room:joined': (data: { roomCode: string; playerIndex: 0 | 1; reconnectToken: string }) => void;
  'room:player_joined': (data: { name: string }) => void;
  'room:player_disconnected': (data: { name: string }) => void;
  'room:player_reconnected': (data: { name: string }) => void;
  'game:started': (data: { playerView: PlayerView }) => void;
  'game:state_update': (data: { playerView: PlayerView }) => void;
  'game:error': (data: { message: string }) => void;
  'game:round_ended': (data: { playerView: PlayerView; roundScores: [number, number]; roundWinner: 0 | 1 | null; roundWins: [number, number] }) => void;
  'game:new_round': (data: { playerView: PlayerView }) => void;
  'game:match_ended': (data: { playerView: PlayerView; finalScores: [number, number]; matchWinner: 0 | 1 | null; roundResults: RoundResult[] }) => void;
  'game:rematch_started': (data: { playerView: PlayerView }) => void;
  'chat:message': (data: ChatMessage) => void;
  'lobby:room_list': (data: { rooms: RoomListItem[] }) => void;
  'lobby:join_request_received': (data: JoinRequest) => void;
  'lobby:join_approved': (data: { roomCode: string; playerIndex: 0 | 1; reconnectToken: string }) => void;
  'lobby:join_rejected': (data: { roomCode: string; reason?: string }) => void;
  'lobby:request_cancelled': (data: { requestId: string }) => void;
}

interface ClientEvents {
  'room:create': (data: { name: string; visibility: RoomVisibility }) => void;
  'room:join': (data: { name: string; roomCode: string }) => void;
  'room:reconnect': (data: { reconnectToken: string }) => void;
  'game:action': (data: { action: GameAction }) => void;
  'game:next_round': () => void;
  'game:rematch': () => void;
  'chat:message': (data: { content: string }) => void;
  'lobby:list': () => void;
  'lobby:join_request': (data: { roomCode: string; name: string }) => void;
  'lobby:join_response': (data: { requestId: string; approved: boolean }) => void;
  'lobby:cancel_request': (data: { roomCode: string }) => void;
}

export function registerSocketEvents(io: Server<ClientEvents, ServerEvents>): void {
  // 辅助函数：向所有连接的客户端广播最新的公开房间列表
  function broadcastRoomList() {
    const rooms = roomManager.getPublicRoomList();
    const connectedSockets = io.sockets.sockets.size;
    console.log(`[Lobby] 广播房间列表更新: ${rooms.length} 个公开房间, ${connectedSockets} 个在线客户端`);
    console.log(`[Lobby] 房间详情:`, JSON.stringify(rooms));
    io.emit('lobby:room_list', { rooms });
  }

  io.on('connection', (socket: Socket<ClientEvents, ServerEvents>) => {
    console.log(`[Socket] 客户端连接: ${socket.id}`);

    // 创建房间
    socket.on('room:create', (data) => {
      const { roomCode, reconnectToken } = roomManager.createRoom(socket.id, data.name, data.visibility);
      socket.join(roomCode);
      socket.emit('room:created', {
        roomCode,
        playerIndex: 0,
        reconnectToken,
      });
      console.log(`[Socket] 房间创建成功: ${roomCode}（${data.visibility}）`);

      // 如果是公开房间，广播房间列表更新
      if (data.visibility === 'public') {
        broadcastRoomList();
      }
    });

    // 加入房间
    socket.on('room:join', (data) => {
      const result = roomManager.joinRoom(socket.id, data.name, data.roomCode);
      if (!result.success) {
        socket.emit('game:error', { message: result.error || '加入房间失败' });
        return;
      }

      const room = roomManager.getRoom(data.roomCode)!;
      socket.join(data.roomCode);

      // 通知加入者
      socket.emit('room:joined', {
        roomCode: data.roomCode,
        playerIndex: result.playerIndex!,
        reconnectToken: result.reconnectToken!,
      });

      // 通知对方有新玩家加入
      socket.to(data.roomCode).emit('room:player_joined', {
        name: data.name,
      });

      // 如果两人齐了，初始化游戏
      if (room.players.size === 2) {
        room.gameState = initializeGame();

        // 向每个玩家发送各自的 PlayerView
        for (const [socketId, player] of room.players.entries()) {
          const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);
          io.to(socketId).emit('game:started', { playerView });
        }

        console.log(`[Socket] 房间 ${data.roomCode} 游戏开始`);
      }

      // 广播房间列表更新（玩家数变化或状态变化）
      broadcastRoomList();
    });

    // 重连
    socket.on('room:reconnect', (data) => {
      const result = roomManager.reconnect(socket.id, data.reconnectToken);
      if (!result.success) {
        socket.emit('game:error', { message: result.error || '重连失败' });
        return;
      }

      const room = roomManager.getRoom(result.roomCode!)!;
      const player = room.players.get(socket.id)!;

      socket.join(result.roomCode!);

      // 发送当前游戏状态
      if (room.gameState) {
        const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);
        socket.emit('game:state_update', { playerView });
      }

      // 通知对方玩家重连
      socket.to(result.roomCode!).emit('room:player_reconnected', {
        name: player.name,
      });

      console.log(`[Socket] 玩家重连成功: ${result.roomCode}`);
    });

    // 游戏动作
    socket.on('game:action', (data) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room || !room.gameState) {
        socket.emit('game:error', { message: '游戏未开始' });
        return;
      }

      const result = handleGameAction(room, socket.id, data.action);
      if (!result.success) {
        socket.emit('game:error', { message: result.error || '操作失败' });
        return;
      }

      // 检查当前局是否结束
      const isRoundOver = room.gameState.gameStatus === 'ROUND_OVER';
      const isMatchFinished = room.gameState.matchStatus === 'FINISHED';

      // 向两个玩家分别发送各自的 PlayerView
      for (const [socketId, player] of room.players.entries()) {
        const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);

        if (isRoundOver && isMatchFinished) {
          // 整场比赛结束
          room.matchFinished = true;
          io.to(socketId).emit('game:match_ended', {
            playerView,
            finalScores: [room.gameState.players[0].score, room.gameState.players[1].score],
            matchWinner: room.gameState.matchWinner,
            roundResults: room.gameState.roundResults,
          });
        } else if (isRoundOver) {
          // 单局结束，比赛继续
          io.to(socketId).emit('game:round_ended', {
            playerView,
            roundScores: [room.gameState.players[0].score, room.gameState.players[1].score],
            roundWinner: room.gameState.winner,
            roundWins: [...room.gameState.roundWins] as [number, number],
          });
        } else {
          io.to(socketId).emit('game:state_update', { playerView });
        }
      }
    });

    // 开始下一局
    socket.on('game:next_round', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room || !room.gameState) {
        socket.emit('game:error', { message: '游戏未开始' });
        return;
      }

      // 只有局结束且比赛未结束时才能开始下一局
      if (room.gameState.gameStatus !== 'ROUND_OVER' || room.gameState.matchStatus === 'FINISHED') {
        socket.emit('game:error', { message: '当前不能开始下一局' });
        return;
      }

      // 初始化新一局
      room.gameState = initializeNewRound(room.gameState);

      // 向每个玩家发送新一局的 PlayerView
      for (const [socketId, player] of room.players.entries()) {
        const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);
        io.to(socketId).emit('game:new_round', { playerView });
      }

      console.log(`[Socket] 房间 ${room.roomCode} 开始第 ${room.gameState.currentRound} 局`);
    });

    // 再来一场（比赛结束后）
    socket.on('game:rematch', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: '房间不存在' });
        return;
      }

      // 只有比赛结束后才能再来一场
      if (!room.matchFinished) {
        socket.emit('game:error', { message: '比赛尚未结束' });
        return;
      }

      // 重置并初始化新的比赛
      room.matchFinished = false;
      room.gameState = initializeGame();

      // 向每个玩家发送新比赛的 PlayerView
      for (const [socketId, player] of room.players.entries()) {
        const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);
        io.to(socketId).emit('game:rematch_started', { playerView });
      }

      console.log(`[Socket] 房间 ${room.roomCode} 开始新一场比赛`);
    });

    // ============================================================
    // 大厅相关事件
    // ============================================================

    // 获取公开房间列表
    socket.on('lobby:list', () => {
      const rooms = roomManager.getPublicRoomList();
      console.log(`[Lobby] 客户端 ${socket.id} 请求房间列表, 返回 ${rooms.length} 个公开房间`);
      console.log(`[Lobby] 房间详情:`, JSON.stringify(rooms));
      socket.emit('lobby:room_list', { rooms });
    });

    // 发送加入申请
    socket.on('lobby:join_request', (data) => {
      const requestId = nanoid();
      const result = roomManager.addJoinRequest(data.roomCode, requestId, data.name, socket.id);

      if (!result.success) {
        socket.emit('game:error', { message: result.error || '发送申请失败' });
        return;
      }

      // 向房主发送加入申请通知
      const hostSocketId = roomManager.getHostSocketId(data.roomCode);
      if (hostSocketId) {
        io.to(hostSocketId).emit('lobby:join_request_received', {
          requestId,
          playerName: data.name,
          roomCode: data.roomCode,
          timestamp: Date.now(),
        });
      }

      console.log(`[Socket] 玩家 ${data.name} 申请加入房间 ${data.roomCode}`);
    });

    // 房主响应加入申请
    socket.on('lobby:join_response', (data) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: '房间不存在' });
        return;
      }

      // 验证当前 socket 是房主
      const hostSocketId = roomManager.getHostSocketId(room.roomCode);
      if (hostSocketId !== socket.id) {
        socket.emit('game:error', { message: '只有房主可以审批加入申请' });
        return;
      }

      if (data.approved) {
        // 同意加入
        const result = roomManager.approveJoinRequest(room.roomCode, data.requestId);
        if (!result.success) {
          socket.emit('game:error', { message: result.error || '审批失败' });
          return;
        }

        // 将申请者的 socket 加入 Socket.IO 房间
        const approvedSocketId = result.socketId!;
        const approvedSocket = io.sockets.sockets.get(approvedSocketId);
        if (approvedSocket) {
          approvedSocket.join(room.roomCode);
        }

        // 通知申请者已被同意
        io.to(approvedSocketId).emit('lobby:join_approved', {
          roomCode: room.roomCode,
          playerIndex: result.playerIndex!,
          reconnectToken: result.reconnectToken!,
        });

        // 通知房主有新玩家加入
        socket.emit('room:player_joined', {
          name: room.players.get(approvedSocketId)?.name || '未知玩家',
        });

        // 如果两人齐了，初始化游戏
        if (room.players.size === 2) {
          room.gameState = initializeGame();

          // 向每个玩家发送各自的 PlayerView
          for (const [socketId, player] of room.players.entries()) {
            const playerView: PlayerView = getPlayerView(room.gameState, player.playerIndex);
            io.to(socketId).emit('game:started', { playerView });
          }

          console.log(`[Socket] 房间 ${room.roomCode} 游戏开始（通过大厅申请加入）`);
        }

        // 广播房间列表更新
        broadcastRoomList();
      } else {
        // 拒绝加入
        const request = roomManager.removeJoinRequest(room.roomCode, data.requestId);
        if (request) {
          io.to(request.socketId).emit('lobby:join_rejected', {
            roomCode: room.roomCode,
            reason: '房主拒绝了你的加入申请',
          });
        }
      }
    });

    // 取消加入申请
    socket.on('lobby:cancel_request', (data) => {
      const request = roomManager.removeJoinRequestBySocketId(data.roomCode, socket.id);
      if (request) {
        // 通知房主申请已取消
        const hostSocketId = roomManager.getHostSocketId(data.roomCode);
        if (hostSocketId) {
          io.to(hostSocketId).emit('lobby:request_cancelled', {
            requestId: request.requestId,
          });
        }
        console.log(`[Socket] 玩家取消了对房间 ${data.roomCode} 的加入申请`);
      }
    });

    // 聊天消息
    socket.on('chat:message', (data) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      const chatMessage: ChatMessage = {
        sender: player.name,
        content: data.content,
        timestamp: Date.now(),
      };

      io.to(room.roomCode).emit('chat:message', chatMessage);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] 客户端断开: ${socket.id}`);
      const disconnectResult = roomManager.removeDisconnectedPlayer(socket.id);
      if (disconnectResult) {
        // 获取断线玩家名称
        const disconnectedPlayer = disconnectResult.room.players.get(socket.id);
        const playerName = disconnectedPlayer?.name || '未知玩家';

        // 通知对方玩家断线
        socket.to(disconnectResult.roomCode).emit('room:player_disconnected', {
          name: playerName,
        });

        // 广播房间列表更新
        broadcastRoomList();
      }
    });
  });
}
