// ============================================================
// 璀璨宝石·对决 - 单张卡牌组件
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

const levelTone: Record<number, string> = {
  1: 'border-orange-300/22 bg-gradient-to-b from-orange-200/14 via-white/4 to-white/0',
  2: 'border-slate-300/22 bg-gradient-to-b from-slate-200/16 via-white/4 to-white/0',
  3: 'border-amber-300/22 bg-gradient-to-b from-amber-200/16 via-white/4 to-white/0',
};

const levelLabel: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
};

const abilityIcons: Record<CardAbility, { icon: string; label: string }> = {
  [CardAbility.ExtraTurn]: { icon: '⟳', label: '额外回合' },
  [CardAbility.TakeToken]: { icon: '◆', label: '拿取宝石' },
  [CardAbility.TakePrivilege]: { icon: '✦', label: '获得特权' },
  [CardAbility.CopyColor]: { icon: '◎', label: '复制颜色' },
  [CardAbility.RobToken]: { icon: '⚔', label: '抢夺宝石' },
};

const bonusTone: Record<string, string> = {
  [GemType.White]: 'from-white to-slate-200 text-slate-900',
  [GemType.Blue]: 'from-sky-300 to-blue-600 text-white',
  [GemType.Green]: 'from-emerald-300 to-emerald-600 text-white',
  [GemType.Red]: 'from-rose-300 to-red-600 text-white',
  [GemType.Black]: 'from-slate-400 to-slate-800 text-white',
  [GemType.Pearl]: 'from-pink-100 to-rose-300 text-rose-900',
  [GemType.Gold]: 'from-amber-200 to-amber-500 text-amber-900',
  Wild: 'from-fuchsia-300 to-violet-600 text-white',
};

const CardItem: React.FC<CardItemProps> = ({
  card,
  canPurchase = false,
  onPurchase,
  onReserve,
  compact = false,
  className = '',
}) => {
  const costEntries = Object.entries(card.cost).filter(([, value]) => (value as number) > 0);

  return (
    <article
      className={`group relative overflow-hidden rounded-[24px] border bg-[#161726]/94 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:border-white/18 ${
        levelTone[card.level]
      } ${compact ? 'w-[126px]' : 'w-[156px]'} ${canPurchase ? 'ring-2 ring-emerald-300/45' : ''} ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.10] to-transparent opacity-70" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-white/45">等级 {levelLabel[card.level]}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-2xl font-semibold text-white">{card.points}</div>
              {card.crowns > 0 && (
                <div className="rounded-full border border-amber-300/25 bg-amber-300/12 px-2 py-1 text-xs font-medium text-amber-100">
                  👑 {card.crowns}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${
              bonusTone[card.bonus]
            } font-semibold shadow-lg shadow-black/20`}
            title={card.bonus === 'Wild' ? '万能奖励' : GEM_DISPLAY_NAMES[card.bonus]}
          >
            {card.bonus === 'Wild' ? 'W' : GEM_DISPLAY_NAMES[card.bonus][0]}
          </div>
        </div>

        {card.ability && (
          <div className="mt-3 rounded-2xl border border-fuchsia-400/18 bg-fuchsia-500/10 px-3 py-2 text-xs font-medium text-fuchsia-100">
            <span className="mr-2">{abilityIcons[card.ability].icon}</span>
            {abilityIcons[card.ability].label}
          </div>
        )}

        <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
          {costEntries.map(([gem, count]) => (
            <div key={gem} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1.5">
              <GemToken gemType={gem as GemType} size="sm" />
              <span className="text-xs font-medium text-white/85">{count as number}</span>
            </div>
          ))}
        </div>

        {(onPurchase || onReserve) && (
          <div className="mt-4 flex gap-2">
            {onPurchase && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onPurchase();
                }}
                disabled={!canPurchase}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  canPurchase
                    ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    : 'bg-white/10 text-white/35'
                }`}
              >
                购买
              </button>
            )}

            {onReserve && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onReserve();
                }}
                className="flex-1 rounded-xl border border-white/12 bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/88 transition hover:border-white/22 hover:bg-white/[0.12]"
              >
                预留
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default CardItem;
