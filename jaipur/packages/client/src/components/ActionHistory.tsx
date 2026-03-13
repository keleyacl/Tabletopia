// ============================================================
// 斋浦尔 - 操作历史面板组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const ActionHistory: React.FC = () => {
  const showActionHistory = useGameStore((s) => s.showActionHistory);
  const setShowActionHistory = useGameStore((s) => s.setShowActionHistory);
  const actionHistory = useGameStore((s) => s.actionHistory);

  return (
    <div className="fixed right-4 bottom-4 flex flex-col items-end gap-2 z-30">
      {/* 操作历史面板 */}
      {showActionHistory && (
        <aside className="w-[min(360px,calc(100vw-24px))] max-h-[min(52vh,420px)] rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)]/95 shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm">
          {/* 头部 */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--color-primary)]/20">
            <span className="text-sm font-bold text-[var(--color-primary)]">
              操作历史
            </span>
            <button
              className="text-xs px-2.5 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
              onClick={() => setShowActionHistory(false)}
            >
              关闭
            </button>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {actionHistory.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg">
                暂无操作记录
              </div>
            ) : (
              [...actionHistory].reverse().map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2 rounded-lg bg-white/60 border border-gray-100 hover:bg-white/80 transition-colors"
                >
                  <div className="text-[11px] text-gray-400 mb-0.5">
                    {item.at}
                  </div>
                  <div className="text-sm text-gray-700 leading-snug">
                    {item.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* 浮动按钮 (FAB) */}
      <button
        className="w-11 h-11 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        onClick={() => setShowActionHistory(!showActionHistory)}
        title="查看操作历史"
        aria-label="查看操作历史"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
          <path d="M8 4H4v4" />
          <path d="M4 8a9 9 0 1 0 3-6.7" />
        </svg>
      </button>
    </div>
  );
};

export default ActionHistory;
