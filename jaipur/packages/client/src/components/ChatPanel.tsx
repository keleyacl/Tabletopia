// ============================================================
// 斋浦尔 - 聊天面板组件
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const ChatPanel: React.FC = () => {
  const chatMessages = useGameStore((state) => state.chatMessages);
  const sendChatMessage = useGameStore((state) => state.sendChatMessage);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg flex flex-col h-64">
      <h2 className="text-lg font-bold text-[var(--color-primary)] mb-3">💬 聊天</h2>
      
      <div className="flex-1 overflow-y-auto mb-3 space-y-2">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            暂无消息
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className="bg-white/50 p-2 rounded">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm text-[var(--color-primary)]">
                  {msg.sender}:
                </span>
                <span className="text-sm text-gray-700">{msg.content}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          发送
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
