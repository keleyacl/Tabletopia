import React from 'react';
import { TileColor } from '@azul/shared';
import Tile, { TileDragItem, TILE_DRAG_TYPE } from './Tile';
import { useGameStore, SelectedTiles } from '../store/gameStore';

// ============================================================
// 中心区域组件
// ============================================================

interface CenterPotProps {
  /** 中心区域的瓷砖 */
  tiles: TileColor[];
  /** 是否为当前玩家的回合 */
  isMyTurn: boolean;
}

const CenterPot: React.FC<CenterPotProps> = ({ tiles, isMyTurn }) => {
  const selectedTiles = useGameStore((s) => s.selectedTiles);
  const selectTiles = useGameStore((s) => s.selectTiles);
  const clearSelection = useGameStore((s) => s.clearSelection);

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
      selectedTiles?.source === 'center' &&
      selectedTiles?.color === color
    ) {
      clearSelection();
      return;
    }

    const count = colorCounts.get(color) || 0;
    const selection: SelectedTiles = {
      source: 'center',
      color,
      count,
    };
    selectTiles(selection);
  };

  const isSelected = (color: TileColor) =>
    selectedTiles?.source === 'center' && selectedTiles?.color === color;

  if (tiles.length === 0) {
    return (
      <div className="center-pot center-pot-empty">
        <span className="center-pot-label">中心</span>
      </div>
    );
  }

  // 按颜色分组显示
  const uniqueColors = Array.from(colorCounts.keys());

  return (
    <div className="center-pot">
      <span className="center-pot-label">中心</span>
      <div className="center-pot-tiles">
        {tiles.map((color, index) => {
          const dragItem: TileDragItem = {
            type: TILE_DRAG_TYPE,
            source: 'center',
            color,
            count: colorCounts.get(color) || 1,
          };

          return (
            <Tile
              key={`center-${index}`}
              color={color}
              draggable={isMyTurn && color !== TileColor.FirstPlayer}
              dragItem={dragItem}
              selected={isSelected(color)}
              onClick={() => handleTileClick(color)}
              size="small"
            />
          );
        })}
      </div>
    </div>
  );
};

export default CenterPot;
