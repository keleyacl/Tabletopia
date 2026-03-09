// ============================================================
// 斋浦尔 - 卡牌组件
// ============================================================

import React from 'react';
import { GoodType, GOOD_ICONS, GOOD_COLORS } from '@jaipur/shared';

interface CardProps {
  /** 货物类型 */
  type: GoodType;
  /** 是否选中 */
  selected?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 卡牌大小 */
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  type,
  selected = false,
  clickable = false,
  onClick,
  size = 'md',
}) => {
  const icon = GOOD_ICONS[type];
  const color = GOOD_COLORS[type];
  
  const sizeClasses = {
    sm: 'w-12 h-16 text-xl',
    md: 'w-16 h-20 text-2xl',
    lg: 'w-20 h-24 text-3xl',
  };

  return (
    <div
      className={`
        relative rounded-lg shadow-md transition-all duration-200
        ${sizeClasses[size]}
        ${selected ? 'ring-4 ring-yellow-400 scale-105' : ''}
        ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}
      `}
      style={{
        backgroundColor: color,
        border: `2px solid ${type === 'CAMEL' ? '#8B4513' : color}`,
      }}
      onClick={clickable ? onClick : undefined}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="drop-shadow-md">{icon}</span>
      </div>
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
          <span className="text-xs">✓</span>
        </div>
      )}
    </div>
  );
};

export default Card;
