// ============================================================
// 璀璨宝石·对决 - 特权卷轴组件
// ============================================================

import React from 'react';

interface PrivilegeTokenProps {
  count: number;
  onClick?: () => void;
  disabled?: boolean;
}

const PrivilegeToken: React.FC<PrivilegeTokenProps> = ({
  count,
  onClick,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-gray-400 uppercase tracking-wider">
        公共特权池
      </div>
      <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={onClick}
            disabled={disabled}
            className={`
              w-8 h-10 rounded-md
              bg-gradient-to-b from-amber-300 to-amber-600
              border border-amber-200/50
              shadow-lg shadow-amber-500/30
              flex items-center justify-center
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}
            `}
          >
            <span className="text-sm text-amber-900 font-bold">📜</span>
          </button>
        ))}
        {count === 0 && (
          <span className="text-sm text-gray-600">空</span>
        )}
      </div>
    </div>
  );
};

export default PrivilegeToken;
