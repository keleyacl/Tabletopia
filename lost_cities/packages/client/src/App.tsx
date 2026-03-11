import React from 'react';
import { useGameStore } from './store/gameStore';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import { JoinRequestModal } from './components/JoinRequestModal';

const App: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);

  return (
    <>
      {roomState ? <GamePage /> : <Lobby />}
      <JoinRequestModal />
    </>
  );
};

export default App;
