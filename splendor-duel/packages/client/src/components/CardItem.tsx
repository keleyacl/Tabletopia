// ============================================================
// 璀璨宝石·对决 - 单张卡牌组件
// 华丽边框（铜/银/金），悬停效果，能力图标
// ============================================================

import React from 'react';
import { Card, GemType, CardAbility } from '@splendor/shared';
import { GEM_DISPLAY_NAMES } from '@splendor/shared';
import GemToken from './GemToken';

interface CardItemProps {
  card: Card;
  canPurchase?: boolean;
  onPurchase?: () => void;
  onReserve?: () => void;
  compact?: boolean;
  className?: string;
}

const levelBorderClass: Record<number, string> = {
  1: 'card-border-level1',
  2: 'card-border-level2',
  3: 'card-border-level3',
};

const levelLabel: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
};

const abilityIcons: Record<CardAbility, { icon: string; label: string }> = {
  [CardAbility.ExtraTurn]: { icon: '⟳', label: '额外回合' },
  [CardAbility.TakeToken]: { icon: '💎', label: '拿取宝石' },
  [CardAbility.TakePrivilege]: { icon: '📜', label: '获得特权' },
  [CardAbility.CopyColor]: { icon: '🎨', label: '复制颜色' },
  [CardAbility.RobToken]: { icon: '⚔️', label: '抢夺宝石' },
};

const bonusGradients: Record<string, string> = {
  [GemType.White]: 'from-gray-100 to-gray-300',
  [GemType.Blue]: 'from-blue-400 to-blue-600',
  [GemType.Green]: 'from-emerald-400 to-emerald-600',
  [GemType.Red]: 'from-red-400 to-red-600',
  [GemType.Black]: 'from-gray-600 to-gray-800',
  [GemType.Pearl]: 'from-pink-200 to-pink-400',
  [GemType.Gold]: 'from-yellow-300 to-amber-500',
  Wild: 'from-purple-400 to-pink-400',
};

const CardItem: React.FC<CardItemProps> = ({
  card,
  canPurchase = false,
  onPurchase,
  onReserve,
  compact = false,
  className = '',
}) => {
  const costEntries = Object.entries(card.cost).filter(([, v]) => (v as number) > 0);

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        ${levelBorderClass[card.level]}
        ${canPurchase ? 'ring-2 ring-emerald-400/60' : ''}
        bg-gradient-to-b from-gray-800/90 to-gray-900/95
        backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl
        group
        ${compact ? 'w-28 p-2' : 'w-36 p-3'}
        ${className}
      `}
    >
      {/* 顶部：分数 + 皇冠 + Bonus 颜色 */}
      <div className="flex items-center justify-between mb-2">
        {/* 分数 */}
        <div className="flex items-center gap-1">
          {card.points > 0 && (
            <span className="text-xl font-bold text-white drop-shadow-lg">
              {card.points}
            </span>
          )}
          {/* 皇冠 */}
          {card.crowns > 0 && (
            <div className="flex">
              {Array.from({ length: card.crowns }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-xs drop-shadow-md">
                  👑
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bonus 颜色标记 */}
        <div
          className={`
            w-6 h-6 rounded-full bg-gradient-to-br ${bonusGradients[card.bonus]}
            shadow-md flex items-center justify-center
          `}
          title={card.bonus === 'Wild' ? '万能' : GEM_DISPLAY_NAMES[card.bonus]}
        >
          {card.bonus === 'Wild' && (
            <span className="text-white text-xs font-bold">W</span>
          )}
        </div>
      </div>

      {/* 能力图标 */}
      {card.ability && (
        <div
          className="mb-2 text-center py-1 rounded bg-purple-900/40 border border-purple-500/20"
          title={abilityIcons[card.ability].label}
        >
          <span className="text-sm">{abilityIcons[card.ability].icon}</span>
          <span className="text-xs text-purple-300 ml-1">
            {abilityIcons[card.ability].label}
          </span>
        </div>
      )}

      {/* 费用 */}
      <div className={`flex flex-wrap gap-1 ${compact ? 'justify-center' : ''}`}>
        {costEntries.map(([gem, count]) => (
          <div key={gem} className="flex items-center gap-0.5">
            <GemToken gemType={gem as GemType} size="sm" />
            <span className="text-xs text-gray-300 font-medium">
              {count as number}
            </span>
          </div>
        ))}
      </div>

      {/* 等级标记 */}
      <div className="absolute top-1 left-1 text-[10px] text-gray-500 font-mono">
        {levelLabel[card.level]}
      </div>

      {/* 操作按钮（悬停显示） */}
      {(onPurchase || onReserve) && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
          {onPurchase && (
            <button
              onClick={(e) => { e.stopPropagation(); onPurchase(); }}
              disabled={!canPurchase}
              className={`
                px-3 py-1 rounded text-xs font-medium transition-all
                ${canPurchase
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              购买
            </button>
          )}
          {onReserve && (
            <button
              onClick={(e) => { e.stopPropagation(); onReserve(); }}
              className="px-3 py-1 rounded text-xs font-medium
                         bg-amber-600 hover:bg-amber-500 text-white transition-all"
            >
              预留
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CardItem;
