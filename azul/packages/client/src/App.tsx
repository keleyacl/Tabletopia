import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { socketService } from './services/socketService';
import { useRoomStore } from './store/roomStore';
import { useGameStore } from './store/gameStore';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';

const App: React.FC = () => {
  const navigate = useNavigate();
  const setConnected = useRoomStore((s) => s.setConnected);
  const updateRoomInfo = useRoomStore((s) => s.updateRoomInfo);
  const setGameStarted = useRoomStore((s) => s.setGameStarted);
  const updateGameState = useGameStore((s) => s.updateGameState);
  const setRoundScoreDetails = useGameStore((s) => s.setRoundScoreDetails);
  const setFinalScores = useGameStore((s) => s.setFinalScores);
  const showGameOverModal = useGameStore((s) => s.showGameOverModal);
  const setError = useGameStore((s) => s.setError);
  const setRestartVote = useGameStore((s) => s.setRestartVote);
  const clearRestartVote = useGameStore((s) => s.clearRestartVote);
  const dismissGameOver = useGameStore((s) => s.dismissGameOver);

  useEffect(() => {
    // 连接 Socket
    socketService.connect();

    // 监听连接状态
    socketService.on('connectionChange', (connected: boolean) => {
      setConnected(connected);
    });

    // 监听房间更新
    socketService.on('room:updated', (data: any) => {
      updateRoomInfo(data.roomInfo);
    });

    // 监听游戏开始
    socketService.on('game:started', (data: any) => {
      setGameStarted();
      updateGameState(data.gameState);
      // 所有玩家收到事件后自动跳转到游戏页面
      const roomInfo = useRoomStore.getState().roomInfo;
      if (roomInfo) {
        navigate(`/game/${roomInfo.roomId}`);
      }
    });

    // 监听游戏状态更新
    socketService.on('game:stateUpdated', (data: any) => {
      updateGameState(data.gameState);
    });

    // 监听回合计分
    socketService.on('game:roundScored', (data: any) => {
      updateGameState(data.gameState);
      setRoundScoreDetails(data.scoreDetails);
    });

    // 监听游戏结束
    socketService.on('game:ended', (data: any) => {
      updateGameState(data.gameState);
      setFinalScores(data.finalScores);
      showGameOverModal();
    });

    // 监听错误
    socketService.on('game:error', (data: any) => {
      setError(data.message);
    });

    socketService.on('room:error', (data: any) => {
      setError(data.message);
    });

    // 监听玩家断线/重连
    socketService.on('game:playerDisconnected', (data: any) => {
      setError(`${data.playerName} 已断线`);
    });

    socketService.on('game:playerReconnected', (data: any) => {
      setError(`${data.playerName} 已重连`);
    });

    // 监听重新开始投票更新
    socketService.on('game:restartVoteUpdate', (data: any) => {
      setRestartVote(data.voteInfo);
    });

    // 监听重新开始投票被拒绝
    socketService.on('game:restartVoteRejected', (data: any) => {
      clearRestartVote();
      setError(`${data.rejectedByName} 拒绝了重新开始`);
    });

    // 监听游戏重新开始
    socketService.on('game:restarted', (data: any) => {
      clearRestartVote();
      dismissGameOver();
      updateGameState(data.gameState);
      const roomInfo = useRoomStore.getState().roomInfo;
      if (roomInfo) {
        navigate(`/game/${roomInfo.roomId}`);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:roomId" element={<GamePage />} />
      </Routes>
    </div>
  );
};

export default App;
