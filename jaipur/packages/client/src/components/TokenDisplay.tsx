// ============================================================
// 斋浦尔 - 标记堆展示组件
// ============================================================

import React from 'react';
import { TradeGoodType, GOOD_ICONS, GOOD_COLORS } from '@jaipur/shared';

interface TokenDisplayProps {
  /** 货物类型 */
  type: TradeGoodType;
  /** 剩余数量 */
  remaining: number;
  /** 栈顶值 */
  topValue: number | null;
  /** 是否已空 */
  isEmpty?: boolean;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({
  type,
  remaining,
  topValue,
  isEmpty = false,
}) => {
  const icon = GOOD_ICONS[type];
  const color = GOOD_COLORS[type];

  return (
    <div
      className={`
        relative rounded-lg shadow-md transition-all duration-200
        ${isEmpty ? 'opacity-40 grayscale' : 'opacity-100'}
      `}
      style={{
        backgroundColor: color,
        width: '60px',
        height: '80px',
        border: `2px solid ${color}`,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl drop-shadow-md mb-1">{icon}</span>
        {topValue !== null ? (
          <span className="text-sm font-bold bg-white/80 px-2 py-1 rounded">
            {topValue}
          </span>
        ) : (
          <span className="text-xs bg-gray-800/80 text-white px-2 py-1 rounded">
            空
          </span>
        )}
      </div>
      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
        {remaining}
      </div>
    </div>
  );
};

export default TokenDisplay;
