// ============================================================
// 斋浦尔 - 提示消息栈组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const ToastStack: React.FC = () => {
  const toasts = useGameStore((state) => state.toasts);
  const removeToast = useGameStore((state) => state.removeToast);

  const typeStyles = {
    info: 'bg-blue-600',
    error: 'bg-red-600',
    success: 'bg-green-600',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${typeStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg
            pointer-events-auto transition-all duration-300
            animate-slide-in
          `}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0">
              {toast.type === 'info' && 'ℹ️'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'success' && '✅'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastStack;
