import React from 'react';
import { useGameStore } from './store/gameStore';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import RulesModal from './components/RulesModal';
import JoinRequestModal from './components/JoinRequestModal';
import ToastStack from './components/ToastStack';

const App: React.FC = () => {
  const roomState = useGameStore((state) => state.roomState);
  const showRulesModal = useGameStore((state) => state.showRulesModal);
  const showJoinRequestModal = useGameStore((state) => state.showJoinRequestModal);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 根据房间状态显示不同页面 */}
      {(roomState === 'idle' || roomState === 'waiting') && <Lobby />}
      {(roomState === 'playing' || roomState === 'finished') && <GamePage />}

      {/* 全局弹窗（仅在 App 层渲染一次） */}
      {showRulesModal && <RulesModal />}
      {showJoinRequestModal && <JoinRequestModal />}
      <ToastStack />
    </div>
  );
};

export default App;