import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GamePage from './pages/GamePage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
