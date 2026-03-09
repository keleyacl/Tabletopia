// ============================================================
// 璀璨宝石·对决 - 宝石 Token 组件
// 精致华丽风格：渐变填充 + 内发光 + 外阴影
// ============================================================

import React from 'react';
import { GemType } from '@splendor/shared';
import { GEM_COLORS, GEM_DISPLAY_NAMES } from '@splendor/shared';

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
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

const gemGradients: Record<GemType, string> = {
  [GemType.White]: 'bg-gradient-to-br from-white via-gray-100 to-gray-200',
  [GemType.Blue]: 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800',
  [GemType.Green]: 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800',
  [GemType.Red]: 'bg-gradient-to-br from-red-400 via-red-600 to-red-800',
  [GemType.Black]: 'bg-gradient-to-br from-gray-500 via-gray-700 to-gray-900',
  [GemType.Pearl]: 'bg-gradient-to-br from-pink-100 via-pink-200 to-pink-300',
  [GemType.Gold]: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700',
};

const gemTextColors: Record<GemType, string> = {
  [GemType.White]: 'text-gray-800',
  [GemType.Blue]: 'text-white',
  [GemType.Green]: 'text-white',
  [GemType.Red]: 'text-white',
  [GemType.Black]: 'text-white',
  [GemType.Pearl]: 'text-pink-800',
  [GemType.Gold]: 'text-yellow-900',
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
  const colors = GEM_COLORS[gemType];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={GEM_DISPLAY_NAMES[gemType]}
      className={`
        relative rounded-full flex items-center justify-center
        ${sizeClasses[size]}
        ${gemGradients[gemType]}
        ${gemTextColors[gemType]}
        font-bold
        transition-all duration-200 ease-out
        ${selected
          ? 'animate-selected-pulse ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent scale-110'
          : 'hover:scale-105'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        boxShadow: selected
          ? `0 0 16px ${colors.glow}, 0 0 32px ${colors.glow}, inset 0 1px 2px rgba(255,255,255,0.3)`
          : `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)`,
        ['--glow-color' as any]: colors.glow,
      }}
    >
      {/* 内部高光 */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6) 0%, transparent 60%)',
        }}
      />

      {/* 数量显示 */}
      {count !== undefined && (
        <span className="relative z-10 font-bold drop-shadow-md">
          {count}
        </span>
      )}
    </button>
  );
};

export default GemToken;
