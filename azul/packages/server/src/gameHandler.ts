import { Server, Socket } from 'socket.io';
import { TileColor, GameState } from '@azul/shared';
import {
  initializeGame,
  takeTilesFromFactory,
  takeTilesFromCenter,
  scoreRound,
  checkGameEnd,
  calculateFinalScores,
  prepareNewRound,
} from '@azul/game-logic';
import {
  getRoom,
  updateGameState,
  markGameStarted,
  canStartGame,
  requestRestart,
  voteRestart,
  clearRestartVotes,
  resetForNewGame,
  Room,
} from './roomManager';

// ============================================================
// 游戏事件处理器
// ============================================================

/**
 * 处理开始游戏
 */
export function handleStartGame(
  io: Server,
  socket: Socket,
  data: { roomId: string; playerId: string }
): void {
  const { roomId, playerId } = data;

  // 校验是否可以开始
  const error = canStartGame(roomId, playerId);
  if (error) {
    socket.emit('game:error', { type: 'ERROR', message: error });
    return;
  }

  const room = getRoom(roomId);
  if (!room) {
    socket.emit('game:error', { type: 'ERROR', message: '房间不存在' });
    return;
  }

  // 初始化游戏
  const playerInfos = room.players.map((p) => ({ id: p.id, name: p.name }));
  const gameState = initializeGame(playerInfos);

  // 更新房间状态
  markGameStarted(roomId);
  updateGameState(roomId, gameState);

  // 广播游戏开始事件
  io.to(roomId).emit('game:started', {
    type: 'GAME_STARTED',
    gameState: sanitizeGameState(gameState),
  });

  console.log(
    `[Game] 房间 ${roomId} 游戏开始，${playerInfos.length} 名玩家`
  );
}

/**
 * 处理从工厂拿砖
 */
export function handleTakeFromFactory(
  io: Server,
  socket: Socket,
  data: {
    roomId: string;
    playerId: string;
    factoryIndex: number;
    color: TileColor;
    targetLineIndex: number;
  }
): void {
  const { roomId, playerId, factoryIndex, color, targetLineIndex } = data;

  const room = getRoom(roomId);
  if (!room || !room.gameState) {
    socket.emit('game:error', { type: 'ERROR', message: '游戏未开始' });
    return;
  }

  const result = takeTilesFromFactory(
    room.gameState,
    playerId,
    factoryIndex,
    color,
    targetLineIndex
  );

  if ('error' in result) {
    socket.emit('game:error', { type: 'ERROR', message: result.error });
    return;
  }

  // 更新游戏状态
  updateGameState(roomId, result);

  // 检查是否进入计分阶段
  if (result.phase === 'TILING') {
    handleTilingPhase(io, roomId, result);
  } else {
    // 广播状态更新
    io.to(roomId).emit('game:stateUpdated', {
      type: 'GAME_STATE_UPDATED',
      gameState: sanitizeGameState(result),
    });
  }
}

/**
 * 处理从中心拿砖
 */
export function handleTakeFromCenter(
  io: Server,
  socket: Socket,
  data: {
    roomId: string;
    playerId: string;
    color: TileColor;
    targetLineIndex: number;
  }
): void {
  const { roomId, playerId, color, targetLineIndex } = data;

  const room = getRoom(roomId);
  if (!room || !room.gameState) {
    socket.emit('game:error', { type: 'ERROR', message: '游戏未开始' });
    return;
  }

  const result = takeTilesFromCenter(
    room.gameState,
    playerId,
    color,
    targetLineIndex
  );

  if ('error' in result) {
    socket.emit('game:error', { type: 'ERROR', message: result.error });
    return;
  }

  // 更新游戏状态
  updateGameState(roomId, result);

  // 检查是否进入计分阶段
  if (result.phase === 'TILING') {
    handleTilingPhase(io, roomId, result);
  } else {
    // 广播状态更新
    io.to(roomId).emit('game:stateUpdated', {
      type: 'GAME_STATE_UPDATED',
      gameState: sanitizeGameState(result),
    });
  }
}

/**
 * 处理计分阶段（回合结束）
 */
function handleTilingPhase(
  io: Server,
  roomId: string,
  state: GameState
): void {
  // 执行回合计分
  const { state: scoredState, scoreDetails } = scoreRound(state);

  // 检查游戏是否结束
  if (checkGameEnd(scoredState)) {
    // 计算终局加分
    const { state: finalState, finalScores } =
      calculateFinalScores(scoredState);

    updateGameState(roomId, finalState);

    // 广播回合计分
    io.to(roomId).emit('game:roundScored', {
      type: 'ROUND_SCORED',
      gameState: sanitizeGameState(finalState),
      scoreDetails,
    });

    // 广播游戏结束
    io.to(roomId).emit('game:ended', {
      type: 'GAME_ENDED',
      gameState: sanitizeGameState(finalState),
      finalScores,
    });

    console.log(`[Game] 房间 ${roomId} 游戏结束`);
  } else {
    // 准备新一轮
    const newRoundState = prepareNewRound(scoredState);

    // 确定下一轮的起始玩家（拿到起始标记的玩家）
    // 在 scoreRound 中地板线已被清空，需要在清空前记录
    // 这里通过 centerTaken 标记来确定：拿到起始标记的玩家在下一轮先手
    // 实际上起始标记在 takeTilesFromCenter 时已经放入了某个玩家的地板线
    // 我们需要在计分前找到持有起始标记的玩家
    const firstPlayerHolder = findFirstPlayerHolder(state);
    const startingPlayerIndex = firstPlayerHolder !== -1
      ? firstPlayerHolder
      : 0;

    const finalNewRoundState: GameState = {
      ...newRoundState,
      currentPlayerIndex: startingPlayerIndex,
    };

    updateGameState(roomId, finalNewRoundState);

    // 广播回合计分
    io.to(roomId).emit('game:roundScored', {
      type: 'ROUND_SCORED',
      gameState: sanitizeGameState(finalNewRoundState),
      scoreDetails,
    });

    console.log(
      `[Game] 房间 ${roomId} 第 ${finalNewRoundState.round} 轮开始`
    );
  }
}

/**
 * 查找持有起始玩家标记的玩家索引
 * 在计分前的状态中查找地板线中包含 FirstPlayer 标记的玩家
 */
function findFirstPlayerHolder(state: GameState): number {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].floorLine.includes(TileColor.FirstPlayer)) {
      return i;
    }
  }
  return -1;
}

// ============================================================
// 重新开始游戏处理器
// ============================================================

/**
 * 处理重新开始请求
 */
export function handleRequestRestart(
  io: Server,
  socket: Socket,
  data: { roomId: string; playerId: string }
): void {
  const { roomId, playerId } = data;

  const result = requestRestart(roomId, playerId);

  if ('error' in result) {
    socket.emit('game:error', { type: 'ERROR', message: result.error });
    return;
  }

  // 广播投票状态给所有玩家
  io.to(roomId).emit('game:restartVoteUpdate', {
    type: 'RESTART_VOTE_UPDATE',
    voteInfo: result.voteInfo,
  });

  // 如果只有一个玩家（理论上不会出现，至少2人），直接重新开始
  if (result.voteInfo.votedPlayers.length === result.voteInfo.totalPlayers) {
    executeRestart(io, roomId);
  }

  console.log(`[Game] 房间 ${roomId} 玩家 ${playerId} 发起了重新开始投票`);
}

/**
 * 处理重新开始投票
 */
export function handleVoteRestart(
  io: Server,
  socket: Socket,
  data: { roomId: string; playerId: string; agree: boolean }
): void {
  const { roomId, playerId, agree } = data;

  const result = voteRestart(roomId, playerId, agree);

  if ('error' in result) {
    socket.emit('game:error', { type: 'ERROR', message: result.error });
    return;
  }

  if ('rejected' in result) {
    // 投票被拒绝，通知所有玩家
    io.to(roomId).emit('game:restartVoteRejected', {
      type: 'RESTART_VOTE_REJECTED',
      rejectedBy: result.rejectedBy,
      rejectedByName: result.rejectedByName,
    });
    console.log(`[Game] 房间 ${roomId} 重新开始投票被 ${result.rejectedByName} 拒绝`);
    return;
  }

  if (result.approved) {
    // 全部同意，执行重新开始
    executeRestart(io, roomId);
    console.log(`[Game] 房间 ${roomId} 全部同意重新开始，开始新一局`);
  } else {
    // 更新投票进度
    io.to(roomId).emit('game:restartVoteUpdate', {
      type: 'RESTART_VOTE_UPDATE',
      voteInfo: result.voteInfo,
    });
    console.log(`[Game] 房间 ${roomId} 重新开始投票进度: ${result.voteInfo.votedPlayers.length}/${result.voteInfo.totalPlayers}`);
  }
}

/**
 * 执行重新开始游戏
 */
function executeRestart(io: Server, roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  // 重置房间状态
  resetForNewGame(roomId);

  // 重新初始化游戏
  const playerInfos = room.players.map((p) => ({ id: p.id, name: p.name }));
  const gameState = initializeGame(playerInfos);

  // 更新房间状态
  markGameStarted(roomId);
  updateGameState(roomId, gameState);

  // 广播游戏重新开始事件
  io.to(roomId).emit('game:restarted', {
    type: 'GAME_RESTARTED',
    gameState: sanitizeGameState(gameState),
  });
}

/**
 * 清理游戏状态，移除不应暴露给客户端的信息
 * 主要是隐藏 bag 的具体内容（防止作弊）
 */
function sanitizeGameState(state: GameState): GameState {
  return {
    ...state,
    bag: [], // 不暴露袋子内容
    discardPile: [], // 不暴露弃置堆内容
  };
}
