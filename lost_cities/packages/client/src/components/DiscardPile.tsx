// ============================================================
// 失落的城市 - 弃牌堆组件
// ============================================================

import React from 'react';
import type { Color, DiscardTops } from '@lost-cities/shared';
import { COLOR_INFO } from '@lost-cities/shared';
import { Card } from './Card';

interface DiscardPileProps {
  discardTops: DiscardTops;
  selectable: boolean;
  onDraw: (color: Color) => void;
}

export const DiscardPile: React.FC<DiscardPileProps> = ({
  discardTops,
  selectable,
  onDraw,
}) => {
  return (
    <div className="stack">
      <h3>弃牌堆</h3>
      <div className="pile-grid">
        {COLOR_INFO.map((color) => (
          <Card
            key={color.id}
            card={discardTops[color.id]}
            selectable={selectable}
            onClick={() => onDraw(color.id)}
          />
        ))}
      </div>
    </div>
  );
};
