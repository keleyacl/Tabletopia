import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';

const App: React.FC = () => {
  const basename =
    import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
