// ============================================================
// 失落的城市 - 规则弹窗
// ============================================================

import React from 'react';
import { RULE_SECTIONS } from '@lost-cities/shared';
import { useGameStore } from '../store/gameStore';

export const RulesModal: React.FC = () => {
  const showRulesModal = useGameStore((s) => s.showRulesModal);
  const setShowRulesModal = useGameStore((s) => s.setShowRulesModal);

  if (!showRulesModal) return null;

  return (
    <div
      className="modal-backdrop rules-backdrop"
      onClick={() => setShowRulesModal(false)}
    >
      <div className="modal rules-modal" onClick={(e) => e.stopPropagation()}>
        <h3>游戏规则</h3>
        <div className="rules-content">
          {RULE_SECTIONS.map((section) => (
            <section key={section.title} className="rules-section">
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={() => setShowRulesModal(false)}>我知道了</button>
        </div>
      </div>
    </div>
  );
};
