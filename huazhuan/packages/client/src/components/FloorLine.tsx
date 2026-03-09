import React from 'react';
import { useDrop } from 'react-dnd';
import { TileColor, FLOOR_PENALTIES } from '@azul/shared';
import Tile, { TILE_DRAG_TYPE } from './Tile';
import { useGameStore } from '../store/gameStore';

// ============================================================
// 地板线组件
// ============================================================

interface FloorLineProps {
  /** 地板线数据 */
  floorLine: (TileColor | null)[];
  /** 是否为当前玩家 */
  isCurrentPlayer: boolean;
  /** 放置到地板线回调 */
  onPlaceTiles?: () => void;
}

const FloorLine: React.FC<FloorLineProps> = ({
  floorLine,
  isCurrentPlayer,
  onPlaceTiles,
}) => {
  const validPlacements = useGameStore((s) => s.validPlacements);
  const selectedTiles = useGameStore((s) => s.selectedTiles);
  const isValidTarget = isCurrentPlayer && validPlacements.includes(-1);

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: TILE_DRAG_TYPE,
      canDrop: () => isValidTarget,
      drop: () => {
        onPlaceTiles?.();
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [isValidTarget, onPlaceTiles]
  );

  const classNames = [
    'floor-line',
    isOver && canDrop ? 'drop-hover' : '',
    isValidTarget && selectedTiles ? 'valid-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={isCurrentPlayer ? dropRef : undefined}
      className={classNames}
      onClick={() => {
        if (isValidTarget && selectedTiles) {
          onPlaceTiles?.();
        }
      }}
    >
      <div className="floor-line-label">地板线</div>
      <div className="floor-line-cells">
        {floorLine.map((tile, index) => (
          <div key={index} className="floor-line-cell">
            {tile ? (
              <Tile color={tile} size="small" />
            ) : (
              <div className="floor-line-empty">
                <span className="floor-penalty">{FLOOR_PENALTIES[index]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloorLine;
