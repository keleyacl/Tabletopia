import React from 'react';
import { TileColor, WALL_PATTERN, BOARD_SIZE } from '@azul/shared';
import Tile from './Tile';

// ============================================================
// 墙面组件（5x5 网格）
// ============================================================

interface WallProps {
  /** 墙面状态：5x5 布尔矩阵 */
  wall: boolean[][];
}

const Wall: React.FC<WallProps> = ({ wall }) => {
  return (
    <div className="wall">
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <div key={row} className="wall-row">
          {Array.from({ length: BOARD_SIZE }, (_, col) => {
            const expectedColor = WALL_PATTERN[row][col];
            const isFilled = wall[row][col];

            return (
              <div
                key={col}
                className={`wall-cell ${isFilled ? 'wall-cell-filled' : 'wall-cell-empty'}`}
              >
                <Tile
                  color={expectedColor}
                  preview={!isFilled}
                  size="normal"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Wall;
