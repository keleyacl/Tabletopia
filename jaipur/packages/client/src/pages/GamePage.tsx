// ============================================================
// 斋浦尔 - 游戏主页面组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import MarketZone from '../components/MarketZone';
import HandZone from '../components/HandZone';
import CamelZone from '../components/CamelZone';
import TokenDisplay from '../components/TokenDisplay';
import ActionBar from '../components/ActionBar';
import OpponentInfo from '../components/OpponentInfo';
import ChatPanel from '../components/ChatPanel';
import GameOverModal from '../components/GameOverModal';
import ActionHistory from '../components/ActionHistory';
import ToastStack from '../components/ToastStack';
import RulesModal from '../components/RulesModal';
import { TRADE_GOODS } from '@jaipur/shared';

const GamePage: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const playerIndex = useGameStore((state) => state.playerIndex);
  const toggleGameMenu = useGameStore((state) => state.toggleGameMenu);
  const showGameMenu = useGameStore((state) => state.showGameMenu);
  const toggleRulesModal = useGameStore((state) => state.toggleRulesModal);

  if (!gameState) return null;

  const { myPlayer, tokenInfo, bonusTokenInfo } = gameState;
  const isMyTurn = gameState.currentPlayerIndex === playerIndex;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4">
      {/* 顶部信息栏 */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-[var(--color-primary)]">
                🎴 斋浦尔
              </h1>
              <div className="text-sm text-gray-600">
                第 <span className="font-bold">{gameState.currentRound}</span> 局
              </div>
              <div className="text-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-1 rounded-full font-bold">
                {playerIndex === 0 ? gameState.roundWins[0] : gameState.roundWins[1]} : {playerIndex === 0 ? gameState.roundWins[1] : gameState.roundWins[0]}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <div className="text-lg font-bold text-[var(--color-primary)]">
                  得分: {myPlayer.score}
                </div>
                {myPlayer.bonusTokens.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <span className="text-xs text-gray-500">奖励:</span>
                    {myPlayer.bonusTokens.map((v, i) => (
                      <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">
                        +{v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isMyTurn && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  你的回合
                </span>
              )}
              <button
                onClick={toggleGameMenu}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ⋮
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主游戏区域 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧：对手信息和标记堆 */}
        <div className="lg:col-span-1 space-y-4">
          <OpponentInfo />
          
          <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--color-primary)] mb-3">💰 货物标记</h2>
            <div className="grid grid-cols-2 gap-2">
              {TRADE_GOODS.map((type) => (
                <TokenDisplay
                  key={type}
                  type={type}
                  remaining={tokenInfo[type].remaining}
                  topValue={tokenInfo[type].topValue}
                  isEmpty={tokenInfo[type].remaining === 0}
                />
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--color-primary)] mb-3">🏆 奖励标记</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="text-sm">3张:</span>
                <span className="font-bold">{bonusTokenInfo.three}</span>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="text-sm">4张:</span>
                <span className="font-bold">{bonusTokenInfo.four}</span>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                <span className="text-sm">5张+:</span>
                <span className="font-bold">{bonusTokenInfo.five}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 中间：市场、手牌、骆驼圈 */}
        <div className="lg:col-span-2 space-y-4">
          <MarketZone />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HandZone />
            <CamelZone />
          </div>
          <ActionBar />
        </div>

        {/* 右侧：聊天 */}
        <div className="lg:col-span-1">
          <ChatPanel />
        </div>
      </div>

      {/* Toast 提示 */}
      <ToastStack />

      {/* 规则弹窗 */}
      <RulesModal />

      {/* 游戏结束弹窗 */}
      <GameOverModal />

      {/* 操作历史面板 */}
      <ActionHistory />

      {/* 游戏菜单 */}
      {showGameMenu && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl p-6 w-64">
            <div className="space-y-3">
              <button
                onClick={() => {
                  toggleRulesModal();
                  toggleGameMenu();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
              >
                📖 规则说明
              </button>
              <button
                onClick={toggleGameMenu}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
              >
                关闭菜单
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors text-red-600"
              >
                退出游戏
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
