// ============================================================
// 失落的城市 - Toast 提示组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ToastStack: React.FC = () => {
  const toasts = useGameStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          {toast.text}
        </div>
      ))}
    </div>
  );
};
