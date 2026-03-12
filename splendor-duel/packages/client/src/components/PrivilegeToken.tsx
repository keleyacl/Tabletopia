// ============================================================
// 璀璨宝石·对决 - 特权卷轴组件
// ============================================================

import React from 'react';

interface PrivilegeTokenProps {
  count: number;
  onClick?: () => void;
  disabled?: boolean;
}

const PrivilegeToken: React.FC<PrivilegeTokenProps> = ({ count, onClick, disabled = false }) => {
  return (
    <aside className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-medium text-white/50">公共特权池</div>
      <div className="mt-2 text-2xl font-semibold text-white">{count}</div>
      <p className="mt-2 text-sm leading-7 text-[#9e94b6]">需要时可以从这里取用卷轴。</p>

      <div className="mt-4 flex flex-col gap-2">
        {count > 0 ? (
          Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={onClick}
              disabled={disabled}
              className={`flex h-12 items-center justify-center rounded-2xl border border-amber-300/28 bg-gradient-to-br from-amber-200 to-amber-500 text-lg shadow-lg shadow-amber-500/15 transition ${
                disabled ? 'cursor-not-allowed opacity-45' : 'hover:scale-[1.02]'
              }`}
            >
              📜
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-6 text-center text-sm leading-6 text-[#9e94b6]">
            特权池已空。
          </div>
        )}
      </div>
    </aside>
  );
};

export default PrivilegeToken;
