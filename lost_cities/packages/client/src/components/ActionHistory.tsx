// ============================================================
// 失落的城市 - 操作历史面板
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ActionHistory: React.FC = () => {
  const showActionHistory = useGameStore((s) => s.showActionHistory);
  const setShowActionHistory = useGameStore((s) => s.setShowActionHistory);
  const actionHistory = useGameStore((s) => s.actionHistory);

  return (
    <div className="action-history-float">
      {showActionHistory && (
        <aside className="action-history-panel">
          <div className="action-history-head">
            <span>操作历史</span>
            <button
              className="secondary action-history-close"
              onClick={() => setShowActionHistory(false)}
            >
              关闭
            </button>
          </div>
          <div className="action-history-list">
            {actionHistory.length === 0 ? (
              <div className="action-history-empty">暂无操作记录</div>
            ) : (
              [...actionHistory].reverse().map((item) => (
                <div key={item.id} className="action-history-item">
                  <div className="action-history-time">{item.at}</div>
                  <div className="action-history-text">{item.text}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
      <button
        className="action-history-fab"
        onClick={() => setShowActionHistory(!showActionHistory)}
        title="查看操作历史"
        aria-label="查看操作历史"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
          <path d="M8 4H4v4" />
          <path d="M4 8a9 9 0 1 0 3-6.7" />
        </svg>
      </button>
    </div>
  );
};
