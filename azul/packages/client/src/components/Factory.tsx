import React from 'react';
import { TileColor } from '@azul/shared';
import Tile, { TileDragItem, TILE_DRAG_TYPE } from './Tile';
import { useGameStore, SelectedTiles } from '../store/gameStore';

// ============================================================
// 单个工厂组件
// ============================================================

interface FactoryProps {
  /** 工厂索引 */
  factoryIndex: number;
  /** 工厂中的瓷砖 */
  tiles: TileColor[];
  /** 是否为当前玩家的回合 */
  isMyTurn: boolean;
}

const Factory: React.FC<FactoryProps> = ({
  factoryIndex,
  tiles,
  isMyTurn,
}) => {
  const selectedTiles = useGameStore((s) => s.selectedTiles);
  const selectTiles = useGameStore((s) => s.selectTiles);
  const clearSelection = useGameStore((s) => s.clearSelection);

  if (tiles.length === 0) {
    return <div className="factory factory-empty" />;
  }

  // 统计每种颜色的数量
  const colorCounts = new Map<TileColor, number>();
  for (const tile of tiles) {
    colorCounts.set(tile, (colorCounts.get(tile) || 0) + 1);
  }

  const handleTileClick = (color: TileColor) => {
    if (!isMyTurn) return;
    if (color === TileColor.FirstPlayer) return;

    // 如果已选中同一来源同一颜色，取消选择
    if (
      selectedTiles?.source === 'factory' &&
      selectedTiles?.factoryIndex === factoryIndex &&
      selectedTiles?.color === color
    ) {
      clearSelection();
      return;
    }

    const count = colorCounts.get(color) || 0;
    const selection: SelectedTiles = {
      source: 'factory',
      factoryIndex,
      color,
      count,
    };
    selectTiles(selection);
  };

  const isSelected = (color: TileColor) =>
    selectedTiles?.source === 'factory' &&
    selectedTiles?.factoryIndex === factoryIndex &&
    selectedTiles?.color === color;

  return (
    <div className="factory">
      <div className="factory-tiles">
        {tiles.map((color, index) => {
          const dragItem: TileDragItem = {
            type: TILE_DRAG_TYPE,
            source: 'factory',
            factoryIndex,
            color,
            count: colorCounts.get(color) || 1,
          };

          return (
            <Tile
              key={`${factoryIndex}-${index}`}
              color={color}
              draggable={isMyTurn && color !== TileColor.FirstPlayer}
              dragItem={dragItem}
              selected={isSelected(color)}
              onClick={() => handleTileClick(color)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Factory;
