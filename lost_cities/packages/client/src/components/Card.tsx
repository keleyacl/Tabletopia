// ============================================================
// 失落的城市 - 卡牌组件
// ============================================================

import React from 'react';
import type { Card as CardType } from '@lost-cities/shared';

interface CardProps {
  card: CardType | null;
  onClick?: () => void;
  selectable?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, selectable }) => {
  if (!card) {
    return <div className="card small">空</div>;
  }
  const label = card.type === 'wager' ? '投资' : '探险';
  const colorClass = `color-${card.color}`;
  return (
    <div
      className={`card small ${card.color} ${colorClass} ${selectable ? 'selectable' : ''}`}
      onClick={selectable ? onClick : undefined}
    >
      <div className="label">{label}</div>
      <div className="value">{card.type === 'wager' ? '×' : card.value}</div>
    </div>
  );
};

interface HandCardProps {
  card: CardType;
  onSelect: () => void;
  active: boolean;
  selected: boolean;
}

export const HandCard: React.FC<HandCardProps> = ({
  card,
  onSelect,
  active,
  selected,
}) => {
  const colorClass = `color-${card.color}`;
  return (
    <div
      className={`card ${card.color} ${colorClass} ${active ? 'selectable' : ''} ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="label">{card.type === 'wager' ? '投资' : '探险'}</div>
      <div className="value">{card.type === 'wager' ? '×' : card.value}</div>
    </div>
  );
};
