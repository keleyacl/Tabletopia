# 璀璨宝石·对决 - 任务清单

## 1. 项目脚手架与基础配置
- [x] 创建 `gem/package.json`（根 monorepo 配置）
- [x] 创建 `gem/tsconfig.base.json`
- [x] 创建 `gem/packages/shared/package.json` 和 `tsconfig.json`
- [x] 创建 `gem/packages/game-logic/package.json`、`tsconfig.json` 和 `vitest.config.ts`
- [x] 创建 `gem/packages/client/package.json`、`tsconfig.json`、`vite.config.ts`、`tailwind.config.js`、`postcss.config.js`、`index.html`
- [x] 创建 `gem/packages/server/package.json` 和 `tsconfig.json`
- [x] 执行 `npm install` 安装依赖

## 2. Shared 包 - 核心类型与常量
- [x] 创建 `packages/shared/src/types.ts`（GemType、CardAbility、Card、Player、GameState 等）
- [x] 创建 `packages/shared/src/constants.ts`（BOARD_SIZE、SPIRAL_ORDER、GEM_COUNTS、胜利条件等）
- [x] 创建 `packages/shared/src/index.ts`（统一导出）

## 3. Shared 包 - 卡牌数据
- [x] 创建 `packages/shared/src/cardData.ts`（Level 1 卡牌数据，约 25 张）
- [x] 补充 `packages/shared/src/cardData.ts`（Level 2 卡牌数据，约 23 张）
- [x] 补充 `packages/shared/src/cardData.ts`（Level 3 卡牌数据，约 15 张）

## 4. Game Logic 包 - 棋盘几何引擎
- [x] 创建 `packages/game-logic/src/boardLogic.ts`（validateSelection、共线判定、相邻判定）
- [x] 补充 `packages/game-logic/src/boardLogic.ts`（refillBoard 螺旋填充、辅助函数）

## 5. Game Logic 包 - 经济核算引擎
- [x] 创建 `packages/game-logic/src/economyEngine.ts`（canAfford、calculateCost、calculateGoldNeeded）
- [x] 补充 `packages/game-logic/src/economyEngine.ts`（executePurchase、returnTokensToBag）

## 6. Game Logic 包 - 特殊能力处理器
- [x] 创建 `packages/game-logic/src/abilityEngine.ts`（triggerAbility、resolveAbility 全部能力）

## 7. Game Logic 包 - 回合状态机与游戏流程
- [x] 创建 `packages/game-logic/src/gameInit.ts`（createInitialState、createEmptyPlayer、shuffleArray）
- [x] 创建 `packages/game-logic/src/turnManager.ts`（advancePhase 状态机、endTurn、canUsePrivilege）
- [x] 创建 `packages/game-logic/src/gameActions.ts`（takeTokens、reserveCard、purchaseCard）
- [x] 补充 `packages/game-logic/src/gameActions.ts`（usePrivilege、refillBoard、discardTokens）
- [x] 创建 `packages/game-logic/src/victoryMonitor.ts`（checkVictory、getVictoryType）
- [x] 创建 `packages/game-logic/src/index.ts`（统一导出）

## 8. Game Logic 包 - 单元测试
- [x] 创建 `packages/game-logic/src/__tests__/boardLogic.test.ts`
- [x] 创建 `packages/game-logic/src/__tests__/economyEngine.test.ts`
- [x] 创建 `packages/game-logic/src/__tests__/gameActions.test.ts`
- [x] 创建 `packages/game-logic/src/__tests__/victoryMonitor.test.ts`
- [x] 运行测试并确保全部通过

## 9. Client 包 - 状态管理与入口
- [x] 创建 `packages/client/src/main.tsx`
- [x] 创建 `packages/client/src/App.tsx`（路由配置）
- [x] 创建 `packages/client/src/styles/globals.css`（Tailwind 指令、宝石光效动画、渐变背景）
- [x] 创建 `packages/client/src/store/gameStore.ts`（Zustand + immer）
- [x] 创建 `packages/client/src/store/roomStore.ts`

## 10. Client 包 - 核心 UI 组件
- [x] 创建 `packages/client/src/components/GemToken.tsx`（宝石 Token，渐变+光效）
- [x] 创建 `packages/client/src/components/GemBoard.tsx`（5x5 棋盘，多选交互）
- [x] 创建 `packages/client/src/components/CardItem.tsx`（单张卡牌，华丽边框）
- [x] 创建 `packages/client/src/components/CardDisplay.tsx`（三级卡牌展示区）
- [x] 创建 `packages/client/src/components/PlayerPanel.tsx`（玩家状态面板）
- [x] 创建 `packages/client/src/components/PrivilegeToken.tsx`（特权卷轴）
- [x] 创建 `packages/client/src/components/ActionBar.tsx`（操作栏）
- [x] 创建 `packages/client/src/components/DiscardModal.tsx`（丢弃宝石弹窗）
- [x] 创建 `packages/client/src/components/AbilityResolver.tsx`（能力解决交互）
- [x] 创建 `packages/client/src/components/VictoryOverlay.tsx`（胜利弹窗）

## 11. Client 包 - 游戏页面
- [x] 创建 `packages/client/src/pages/GamePage.tsx`（游戏主页面布局）

## 12. Client 包 - Socket 服务
- [x] 创建 `packages/client/src/services/socketService.ts`

## 13. Server 包
- [x] 创建 `packages/server/src/server.ts`（Express + Socket.IO 入口）
- [x] 创建 `packages/server/src/roomManager.ts`（房间管理）
- [x] 创建 `packages/server/src/gameHandler.ts`（游戏处理器）
- [x] 创建 `packages/server/src/socketEvents.ts`（事件处理）

## 14. 集成验证
- [x] 编译 shared 包（`tsc --noEmit`）
- [x] 编译 game-logic 包（`tsc --noEmit`）
- [x] 运行 game-logic 单元测试
- [x] 编译 client 包（`vite build`）
- [x] 编译 server 包（`tsc --noEmit`）


---
生成时间: 2026/3/9 16:41:56
planId: 