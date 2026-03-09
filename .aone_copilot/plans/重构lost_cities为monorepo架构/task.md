
# 重构 lost_cities 为 monorepo 架构 - 任务清单

## 阶段一：根级配置

- [x] 创建根级 `package.json`（npm workspaces 配置）
- [x] 创建根级 `tsconfig.base.json`
- [x] 更新 `.gitignore`

## 阶段二：packages/shared

- [x] 创建 `packages/shared/package.json`
- [x] 创建 `packages/shared/tsconfig.json`
- [x] 创建 `packages/shared/src/types.ts`（从 engine.js 和 App.jsx 提取类型定义）
- [x] 创建 `packages/shared/src/constants.ts`（从 engine.js 和 App.jsx 提取常量）
- [x] 创建 `packages/shared/src/index.ts`

## 阶段三：packages/game-logic

- [x] 创建 `packages/game-logic/package.json`
- [x] 创建 `packages/game-logic/tsconfig.json`
- [x] 创建 `packages/game-logic/vitest.config.ts`
- [x] 创建 `packages/game-logic/src/gameInit.ts`（迁移 engine.js 中的初始化逻辑）
- [x] 创建 `packages/game-logic/src/gameScoring.ts`（迁移 engine.js 中的计分逻辑）
- [x] 创建 `packages/game-logic/src/utils.ts`（迁移 cloneState、getTopDiscard）
- [x] 创建 `packages/game-logic/src/gameActions.ts`（迁移 engine.js 中的动作逻辑）
- [x] 创建 `packages/game-logic/src/index.ts`
- [x] 创建 `packages/game-logic/src/__tests__/gameInit.test.ts`
- [x] 创建 `packages/game-logic/src/__tests__/gameScoring.test.ts`
- [x] 创建 `packages/game-logic/src/__tests__/gameActions.test.ts`

## 阶段四：packages/server

- [x] 创建 `packages/server/package.json`
- [x] 创建 `packages/server/tsconfig.json`
- [x] 创建 `packages/server/src/server.ts`（WebSocket 服务器入口）
- [x] 创建 `packages/server/src/roomManager.ts`（从 room.js 迁移房间管理）
- [x] 创建 `packages/server/src/gameHandler.ts`（游戏动作处理器）
- [x] 创建 `packages/server/src/socketEvents.ts`（从 index.js 迁移消息处理）

## 阶段五：packages/client

- [x] 创建 `packages/client/package.json`
- [x] 创建 `packages/client/tsconfig.json`
- [x] 创建 `packages/client/vite.config.ts`
- [x] 创建 `packages/client/index.html`
- [x] 创建 `packages/client/src/main.tsx`
- [x] 创建 `packages/client/src/App.tsx`
- [x] 创建 `packages/client/src/styles/global.css`（迁移原有样式）
- [x] 创建 `packages/client/src/services/socketService.ts`（提取 WebSocket 通信）
- [x] 创建 `packages/client/src/store/roomStore.ts`（提取房间状态管理）
- [x] 创建 `packages/client/src/store/gameStore.ts`（提取游戏状态管理）
- [x] 创建 `packages/client/src/pages/Lobby.tsx`（提取大厅页面）
- [x] 创建 `packages/client/src/pages/GamePage.tsx`（提取游戏页面）
- [x] 创建 `packages/client/src/components/Card.tsx`（提取卡牌组件）
- [x] 创建 `packages/client/src/components/ExpeditionRow.tsx`（提取探险列组件）
- [x] 创建 `packages/client/src/components/DiscardPile.tsx`（提取弃牌堆组件）
- [x] 创建 `packages/client/src/components/HandZone.tsx`（提取手牌区组件）
- [x] 创建 `packages/client/src/components/RoundResultModal.tsx`（提取局结算弹窗）
- [x] 创建 `packages/client/src/components/RulesModal.tsx`（提取规则弹窗）
- [x] 创建 `packages/client/src/components/ChatPanel.tsx`（提取聊天面板）
- [x] 创建 `packages/client/src/components/ActionHistory.tsx`（提取操作历史面板）
- [x] 创建 `packages/client/src/components/ToastStack.tsx`（提取 Toast 组件）

## 阶段六：清理与验证

- [x] 删除旧的 `lost_cities/client/` 目录
- [x] 删除旧的 `lost_cities/server/` 目录
- [x] 删除 `lost_cities/lan-start.sh`
- [x] 更新 `lost_cities/README.md`
- [x] 执行 `npm install` 安装依赖
- [x] 执行 `npm run build` 验证 TypeScript 编译
- [x] 执行 `npm run test` 验证单元测试通过


---
生成时间: 2026/3/9 19:01:33
planId: 