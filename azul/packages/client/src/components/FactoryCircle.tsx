import React from 'react';
import { TileColor, Factory as FactoryType } from '@azul/shared';
import Factory from './Factory';
import CenterPot from './CenterPot';

// ============================================================
// 工厂环形区域组件
// ============================================================

interface FactoryCircleProps {
  /** 所有工厂 */
  factories: FactoryType[];
  /** 中心区域瓷砖 */
  centerPot: TileColor[];
  /** 是否为当前玩家的回合 */
  isMyTurn: boolean;
}

const FactoryCircle: React.FC<FactoryCircleProps> = ({
  factories,
  centerPot,
  isMyTurn,
}) => {
  const factoryCount = factories.length;
  const radius = Math.max(120, factoryCount * 30); // 根据工厂数量调整半径

  return (
    <div className="factory-circle-container">
      <div
        className="factory-circle"
        style={{
          width: `${radius * 2 + 120}px`,
          height: `${radius * 2 + 120}px`,
        }}
      >
        {/* 中心区域 */}
        <div className="factory-circle-center">
          <CenterPot tiles={centerPot} isMyTurn={isMyTurn} />
        </div>

        {/* 环形排列的工厂 */}
        {factories.map((factory, index) => {
          const angle = (2 * Math.PI * index) / factoryCount - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={index}
              className="factory-position"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <Factory
                factoryIndex={index}
                tiles={factory}
                isMyTurn={isMyTurn}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FactoryCircle;
