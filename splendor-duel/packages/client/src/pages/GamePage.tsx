// ============================================================
// 璀璨宝石·对决 - 游戏主页面
// 布局：顶部对手面板 / 中间棋盘+卡牌 / 底部当前玩家面板
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import GemBoard from '../components/GemBoard';
import CardDisplay from '../components/CardDisplay';
import PlayerPanel from '../components/PlayerPanel';
import PrivilegeToken from '../components/PrivilegeToken';
import ActionBar from '../components/ActionBar';
import DiscardModal from '../components/DiscardModal';
import AbilityResolver from '../components/AbilityResolver';
import VictoryOverlay from '../components/VictoryOverlay';

const GamePage: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const initGame = useGameStore((s) => s.initGame);

  const { currentPlayerIndex, players, privilegePool } = gameState;

  // 玩家 0 在底部，玩家 1 在顶部
  const topPlayer = players[1];
  const bottomPlayer = players[0];
  const topIsActive = currentPlayerIndex === 1;
  const bottomIsActive = currentPlayerIndex === 0;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4">
      {/* 标题栏 */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400
                       bg-clip-text text-transparent">
          璀璨宝石·对决
        </h1>
        <button
          onClick={initGame}
          className="px-3 py-1.5 rounded-lg bg-gray-800/60 text-gray-400 text-xs
                     hover:bg-gray-700/60 hover:text-gray-300 transition-all
                     border border-gray-700/30"
        >
          新游戏
        </button>
      </header>

      {/* 对手面板（顶部） */}
      <PlayerPanel
        player={topPlayer}
        isCurrentPlayer={currentPlayerIndex === 1}
        isActive={topIsActive}
        position="top"
      />

      {/* 中间区域：棋盘 + 卡牌展示 */}
      <div className="flex-1 flex gap-6 items-start justify-center">
        {/* 左侧：棋盘 + 特权池 */}
        <div className="flex flex-col items-center gap-4">
          <GemBoard />
          <PrivilegeToken count={privilegePool} />
        </div>

        {/* 右侧：卡牌展示区 */}
        <CardDisplay />
      </div>

      {/* 操作栏 */}
      <ActionBar />

      {/* 当前玩家面板（底部） */}
      <PlayerPanel
        player={bottomPlayer}
        isCurrentPlayer={currentPlayerIndex === 0}
        isActive={bottomIsActive}
        position="bottom"
      />

      {/* 弹窗层 */}
      <DiscardModal />
      <AbilityResolver />
      <VictoryOverlay />
    </div>
  );
};

export default GamePage;
