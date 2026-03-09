import React from 'react';
import { useDrop } from 'react-dnd';
import { TileColor } from '@azul/shared';
import Tile, { TileDragItem, TILE_DRAG_TYPE } from './Tile';
import { useGameStore } from '../store/gameStore';

// ============================================================
// 模式线组件（左侧阶梯状）
// ============================================================

interface PatternLinesProps {
  /** 模式线数据：5 行，第 i 行容量 i+1 */
  patternLines: (TileColor | null)[][];
  /** 是否为当前玩家（可交互） */
  isCurrentPlayer: boolean;
  /** 放置瓷砖回调 */
  onPlaceTiles?: (targetLineIndex: number) => void;
}

const PatternLines: React.FC<PatternLinesProps> = ({
  patternLines,
  isCurrentPlayer,
  onPlaceTiles,
}) => {
  const validPlacements = useGameStore((s) => s.validPlacements);
  const selectedTiles = useGameStore((s) => s.selectedTiles);

  return (
    <div className="pattern-lines">
      {patternLines.map((line, rowIndex) => (
        <PatternLineRow
          key={rowIndex}
          rowIndex={rowIndex}
          line={line}
          isCurrentPlayer={isCurrentPlayer}
          isValidTarget={
            isCurrentPlayer && validPlacements.includes(rowIndex)
          }
          hasSelection={selectedTiles !== null}
          onDrop={() => onPlaceTiles?.(rowIndex)}
          onClick={() => {
            if (
              isCurrentPlayer &&
              selectedTiles &&
              validPlacements.includes(rowIndex)
            ) {
              onPlaceTiles?.(rowIndex);
            }
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// 单行模式线
// ============================================================

interface PatternLineRowProps {
  rowIndex: number;
  line: (TileColor | null)[];
  isCurrentPlayer: boolean;
  isValidTarget: boolean;
  hasSelection: boolean;
  onDrop: () => void;
  onClick: () => void;
}

const PatternLineRow: React.FC<PatternLineRowProps> = ({
  rowIndex,
  line,
  isCurrentPlayer,
  isValidTarget,
  hasSelection,
  onDrop,
  onClick,
}) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: TILE_DRAG_TYPE,
      canDrop: () => isCurrentPlayer && isValidTarget,
      drop: () => {
        onDrop();
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [isCurrentPlayer, isValidTarget, onDrop]
  );

  const capacity = rowIndex + 1;
  const classNames = [
    'pattern-line-row',
    isOver && canDrop ? 'drop-hover' : '',
    isValidTarget && hasSelection ? 'valid-target' : '',
    !isValidTarget && hasSelection ? 'invalid-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 从右到左渲染格子（模式线右对齐）
  const cells = [];
  for (let i = 0; i < capacity; i++) {
    const tileColor = line[i];
    cells.push(
      <div key={i} className="pattern-line-cell">
        {tileColor ? (
          <Tile color={tileColor} size="normal" />
        ) : (
          <div className="pattern-line-empty" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={isCurrentPlayer ? dropRef : undefined}
      className={classNames}
      onClick={onClick}
    >
      <div className="pattern-line-cells">{cells}</div>
      <div className="pattern-line-label">{rowIndex + 1}</div>
    </div>
  );
};

export default PatternLines;
