import React from 'react';
import { PlayerBoard as PlayerBoardType, TileColor } from '@azul/shared';
import PatternLines from './PatternLines';
import Wall from './Wall';
import FloorLine from './FloorLine';
import { useGameStore } from '../store/gameStore';
import { useRoomStore } from '../store/roomStore';
import { socketService } from '../services/socketService';

// ============================================================
// 玩家板组件
// ============================================================

interface PlayerBoardProps {
  /** 玩家板数据 */
  player: PlayerBoardType;
  /** 是否为当前行动的玩家 */
  isActivePlayer: boolean;
  /** 是否为"我"的板 */
  isMe: boolean;
}

const PlayerBoardComponent: React.FC<PlayerBoardProps> = ({
  player,
  isActivePlayer,
  isMe,
}) => {
  const selectedTiles = useGameStore((s) => s.selectedTiles);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const setError = useGameStore((s) => s.setError);
  const roomInfo = useRoomStore((s) => s.roomInfo);

  const isCurrentPlayer = isActivePlayer && isMe;

  /**
   * 处理放置瓷砖到模式线或地板线
   * @param targetLineIndex 模式线行索引，-1 表示地板线
   */
  const handlePlaceTiles = (targetLineIndex: number) => {
    if (!selectedTiles || !roomInfo) return;

    const roomId = roomInfo.roomId;
    const playerId = player.id;

    if (selectedTiles.source === 'factory' && selectedTiles.factoryIndex !== undefined) {
      socketService.takeFromFactory(
        roomId,
        playerId,
        selectedTiles.factoryIndex,
        selectedTiles.color,
        targetLineIndex
      );
    } else if (selectedTiles.source === 'center') {
      socketService.takeFromCenter(
        roomId,
        playerId,
        selectedTiles.color,
        targetLineIndex
      );
    }

    clearSelection();
  };

  const boardClassNames = [
    'player-board',
    isActivePlayer ? 'player-board-active' : '',
    isMe ? 'player-board-me' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={boardClassNames}>
      {/* 玩家信息头部 */}
      <div className="player-board-header">
        <div className="player-board-name">
          {player.name}
          {isMe && <span className="me-indicator"> (我)</span>}
        </div>
        <div className="player-board-score">
          <span className="score-label">分数</span>
          <span className="score-value">{player.score}</span>
        </div>
        {isActivePlayer && (
          <div className="active-indicator">当前行动</div>
        )}
      </div>

      {/* 主体区域：模式线 + 墙面 */}
      <div className="player-board-body">
        <div className="player-board-left">
          <PatternLines
            patternLines={player.patternLines}
            isCurrentPlayer={isCurrentPlayer}
            onPlaceTiles={handlePlaceTiles}
          />
        </div>
        <div className="player-board-right">
          <Wall wall={player.wall} />
        </div>
      </div>

      {/* 地板线 */}
      <div className="player-board-footer">
        <FloorLine
          floorLine={player.floorLine}
          isCurrentPlayer={isCurrentPlayer}
          onPlaceTiles={() => handlePlaceTiles(-1)}
        />
      </div>
    </div>
  );
};

export default PlayerBoardComponent;
