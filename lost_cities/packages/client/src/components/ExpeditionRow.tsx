// ============================================================
// 失落的城市 - 探险列行组件
// ============================================================

import React from 'react';
import type { Card as CardType, Color } from '@lost-cities/shared';
import { Card } from './Card';
import { scoreExpedition } from '@lost-cities/game-logic';

interface ExpeditionRowProps {
  colorId: Color;
  colorName: string;
  expedition: CardType[];
}

export const ExpeditionRow: React.FC<ExpeditionRowProps> = ({
  colorId,
  colorName,
  expedition,
}) => {
  const colorScore = scoreExpedition(expedition);
  return (
    <div className="expedition-row">
      <div className="row-head">
        <div className="row-label">{colorName}</div>
        <div
          className={`row-score ${colorScore > 0 ? 'positive' : colorScore < 0 ? 'negative' : ''}`}
        >
          {colorScore > 0 ? `+${colorScore}` : colorScore}
        </div>
      </div>
      <div className="expedition-cards">
        {expedition.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};
