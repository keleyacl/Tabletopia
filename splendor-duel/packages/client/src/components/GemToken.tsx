// ============================================================
// 璀璨宝石·对决 - 宝石 Token 组件
// ============================================================

import React from 'react';
import { GemType } from '@splendor/shared';
import { GEM_DISPLAY_NAMES } from '@splendor/shared';

interface GemTokenProps {
  gemType: GemType;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
};

const tokenTone: Record<GemType, string> = {
  [GemType.White]: 'from-white via-slate-100 to-slate-300 text-slate-800 border-slate-200/60',
  [GemType.Blue]: 'from-sky-300 via-blue-500 to-blue-700 text-white border-sky-200/40',
  [GemType.Green]: 'from-emerald-300 via-emerald-500 to-emerald-700 text-white border-emerald-200/40',
  [GemType.Red]: 'from-rose-300 via-red-500 to-red-700 text-white border-rose-200/40',
  [GemType.Black]: 'from-slate-400 via-slate-600 to-slate-900 text-white border-slate-200/15',
  [GemType.Pearl]: 'from-pink-100 via-rose-200 to-pink-300 text-rose-900 border-pink-100/60',
  [GemType.Gold]: 'from-amber-200 via-amber-400 to-amber-600 text-amber-900 border-amber-100/50',
};

const GemToken: React.FC<GemTokenProps> = ({
  gemType,
  size = 'md',
  selected = false,
  disabled = false,
  count,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={GEM_DISPLAY_NAMES[gemType]}
      className={`relative flex items-center justify-center rounded-full border bg-gradient-to-br font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_18px_rgba(0,0,0,0.22)] transition ${sizeClasses[size]} ${
        tokenTone[gemType]
      } ${selected ? 'scale-110 ring-2 ring-cyan-300/65 ring-offset-2 ring-offset-transparent' : 'hover:scale-105'} ${
        disabled ? 'cursor-not-allowed opacity-40' : onClick ? 'cursor-pointer' : 'cursor-default'
      } ${className}`}
    >
      <span className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.58),transparent_48%)] opacity-70" />
      <span className="absolute bottom-[16%] right-[18%] h-[18%] w-[18%] rounded-full bg-black/10 blur-[2px]" />
      {count !== undefined && <span className="relative z-10">{count}</span>}
    </button>
  );
};

export default GemToken;
