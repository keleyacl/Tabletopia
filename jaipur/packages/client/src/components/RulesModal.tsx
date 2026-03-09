// ============================================================
// 斋浦尔 - 规则说明弹窗组件
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

const RulesModal: React.FC = () => {
  const showRulesModal = useGameStore((state) => state.showRulesModal);
  const toggleRulesModal = useGameStore((state) => state.toggleRulesModal);

  if (!showRulesModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-primary)] p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[var(--color-primary)]">
              🎴 斋浦尔 (Jaipur) 游戏规则
            </h2>
            <button
              onClick={toggleRulesModal}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 游戏目标 */}
          <section>
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              🎯 游戏目标
            </h3>
            <p className="text-gray-700 leading-relaxed">
              成为更富有的商人！通过交易货物、获得标记和奖励标记来积累分数。
              当3个货物标记堆被清空或牌堆用尽时游戏结束，分数高者获胜。
            </p>
          </section>

          {/* 四种行动 */}
          <section>
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              🎮 四种行动
            </h3>
            <div className="space-y-3">
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-bold text-[var(--color-primary-dark)]">1. 取一张牌</h4>
                <p className="text-gray-700 text-sm mt-1">
                  从市场中取一张牌加入手牌，然后从牌堆补充一张牌到市场。
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-bold text-[var(--color-primary-dark)]">2. 取所有骆驼</h4>
                <p className="text-gray-700 text-sm mt-1">
                  如果市场中有骆驼，可以一次性取走所有骆驼放入骆驼圈。
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-bold text-[var(--color-primary-dark)]">3. 交换</h4>
                <p className="text-gray-700 text-sm mt-1">
                  用手牌和骆驼圈中的骆驼交换市场中的牌。至少交换2张牌。
                  交换的牌数必须相等（手牌+骆驼 = 市场牌）。
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-bold text-[var(--color-primary-dark)]">4. 出售货物</h4>
                <p className="text-gray-700 text-sm mt-1">
                  出售同一种类的货物。高级货物（钻石、黄金、白银）至少出售2张，
                  其他货物至少出售1张。获得对应货物标记堆顶部的分数。
                </p>
              </div>
            </div>
          </section>

          {/* 奖励标记 */}
          <section>
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              🏆 奖励标记
            </h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              当你一次出售3、4、5张及以上货物时，可以获得对应的奖励标记：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>出售3张：获得3、3、2、2、2、1、1分中的一个</li>
              <li>出售4张：获得6、6、5、5、4、4分中的一个</li>
              <li>出售5张及以上：获得10、10、9、8、8分中的一个</li>
            </ul>
          </section>

          {/* 骆驼王 */}
          <section>
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              🐪 骆驼王
            </h3>
            <p className="text-gray-700 leading-relaxed">
              游戏结束时，拥有最多骆驼的玩家获得5分骆驼王奖励。
            </p>
          </section>

          {/* 结束条件 */}
          <section>
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              🏁 游戏结束
            </h3>
            <p className="text-gray-700 leading-relaxed">
              当3个货物标记堆被清空或牌堆用尽时游戏立即结束。
              最终得分 = 货物标记分 + 奖励标记分 + 骆驼王分。
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-primary)] p-4">
          <button
            onClick={toggleRulesModal}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            我明白了
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
