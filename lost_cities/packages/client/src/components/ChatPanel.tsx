// ============================================================
// 失落的城市 - 聊天面板
// ============================================================

import React from 'react';
import { QUICK_CHAT_MESSAGES } from '@lost-cities/shared';
import { useGameStore, formatChatTime } from '../store/gameStore';

export const ChatPanel: React.FC = () => {
  const showChatPanel = useGameStore((s) => s.showChatPanel);
  const setShowChatPanel = useGameStore((s) => s.setShowChatPanel);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const chatInput = useGameStore((s) => s.chatInput);
  const setChatInput = useGameStore((s) => s.setChatInput);
  const sendChatMessage = useGameStore((s) => s.sendChatMessage);
  const roomState = useGameStore((s) => s.roomState);

  return (
    <div className="chat-float">
      {showChatPanel && (
        <aside className="chat-panel">
          <div className="chat-head">
            <span>消息</span>
            <button
              className="secondary chat-close"
              onClick={() => setShowChatPanel(false)}
            >
              关闭
            </button>
          </div>
          <div className="chat-quick-list">
            {QUICK_CHAT_MESSAGES.map((item) => (
              <button
                key={item}
                className="secondary chat-quick-btn"
                onClick={() => sendChatMessage(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="chat-list">
            {chatMessages.length === 0 ? (
              <div className="chat-empty">还没有消息</div>
            ) : (
              chatMessages.map((item) => {
                const isSelf = item.senderId === roomState?.you;
                return (
                  <div
                    key={item.id}
                    className={`chat-item ${isSelf ? 'self' : ''}`}
                  >
                    <div className="chat-meta">
                      <span>{isSelf ? '你' : item.senderName}</span>
                      <span>{formatChatTime(item.at)}</span>
                    </div>
                    <div className="chat-text">{item.text}</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="chat-input-row">
            <input
              placeholder="输入消息"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
            />
            <button onClick={() => sendChatMessage()}>发送</button>
          </div>
        </aside>
      )}
      <button
        className="chat-fab"
        onClick={() => setShowChatPanel(!showChatPanel)}
        title="发送消息"
        aria-label="发送消息"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16v10H7l-3 3z" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
        </svg>
      </button>
    </div>
  );
};
