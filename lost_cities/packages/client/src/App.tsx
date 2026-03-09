import React from 'react';
import { useGameStore } from './store/gameStore';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';

const App: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);

  return roomState ? <GamePage /> : <Lobby />;
};

export default App;
