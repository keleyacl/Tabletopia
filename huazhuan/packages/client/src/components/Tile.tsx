import React from 'react';
import { useDrag } from 'react-dnd';
import { TileColor } from '@azul/shared';

// ============================================================
// 瓷砖组件
// ============================================================

/** 拖拽项类型常量 */
export const TILE_DRAG_TYPE = 'TILE';

/** 拖拽项数据 */
export interface TileDragItem {
  type: typeof TILE_DRAG_TYPE;
  source: 'factory' | 'center';
  factoryIndex?: number;
  color: TileColor;
  count: number;
}

/** 瓷砖颜色到 CSS 类名的映射 */
const TILE_COLOR_MAP: Record<string, string> = {
  [TileColor.Blue]: 'tile-blue',
  [TileColor.Yellow]: 'tile-yellow',
  [TileColor.Red]: 'tile-red',
  [TileColor.Black]: 'tile-black',
  [TileColor.White]: 'tile-white',
  [TileColor.FirstPlayer]: 'tile-first-player',
};

/** 瓷砖颜色到中文名的映射 */
const TILE_COLOR_NAME: Record<string, string> = {
  [TileColor.Blue]: '蓝',
  [TileColor.Yellow]: '黄',
  [TileColor.Red]: '红',
  [TileColor.Black]: '黑',
  [TileColor.White]: '白',
  [TileColor.FirstPlayer]: '1',
};

interface TileProps {
  color: TileColor;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 拖拽数据 */
  dragItem?: TileDragItem;
  /** 是否被选中 */
  selected?: boolean;
  /** 是否为墙面上的预览（半透明） */
  preview?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 尺寸 */
  size?: 'small' | 'normal' | 'large';
}

const Tile: React.FC<TileProps> = ({
  color,
  draggable = false,
  dragItem,
  selected = false,
  preview = false,
  onClick,
  size = 'normal',
}) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: TILE_DRAG_TYPE,
      item: dragItem || {
        type: TILE_DRAG_TYPE,
        source: 'factory' as const,
        color,
        count: 1,
      },
      canDrag: draggable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [draggable, dragItem, color]
  );

  const colorClass = TILE_COLOR_MAP[color] || '';
  const sizeClass = `tile-${size}`;

  const classNames = [
    'tile',
    colorClass,
    sizeClass,
    selected ? 'tile-selected' : '',
    preview ? 'tile-preview' : '',
    isDragging ? 'tile-dragging' : '',
    draggable ? 'tile-draggable' : '',
    onClick ? 'tile-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={draggable ? dragRef : undefined}
      className={classNames}
      onClick={onClick}
      title={TILE_COLOR_NAME[color]}
    >
      {color === TileColor.FirstPlayer && (
        <span className="first-player-marker">1</span>
      )}
    </div>
  );
};

export default Tile;
