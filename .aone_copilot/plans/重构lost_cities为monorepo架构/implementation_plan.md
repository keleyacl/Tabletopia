
# 按照 splendor-duel 架构重构 lost_cities 为 monorepo

将 lost_cities 从扁平的 client/server JavaScript 结构，重构为与 splendor-duel 一致的 npm workspaces monorepo + TypeScript 四包分层架构，**不修改任何原有游戏逻辑**。

## User Review Required

> [!IMPORTANT]
> lost_cities 原有的 WebSocket 通信方式（原生 `ws` 库）与 splendor-duel 使用的 `socket.io` 不同。本次重构**保留原有的原生 WebSocket 通信方式**，仅做 TypeScript 迁移和代码分层，不切换到 socket.io，以确保逻辑完全不变。

> [!WARNING]
> 重构后原有的 `lost_cities/client/` 和 `lost_cities/server/` 目录将被删除，由新的 `lost_cities/packages/` 目录替代。原有的 `node_modules/` 和 `package-lock.json` 也将被替换为根级统一管理。

## Proposed Changes

### 根级 Monorepo 配置

新增根级 `package.json`、`tsconfig.base.json`、`.gitignore` 等配置文件，建立 npm workspaces 管理。

#### [NEW] [package.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/package.json)
- 定义 `name: "lost-cities"`，`private: true`
- 配置 `workspaces`: `["packages/shared", "packages/game-logic", "packages/server", "packages/client"]`
- 添加 `scripts`: `dev:server`, `dev:client`, `dev`（concurrently）, `build`, `test`
- `devDependencies`: `concurrently`, `typescript`

#### [NEW] [tsconfig.base.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/tsconfig.base.json)
- 与 splendor-duel 一致的 TypeScript 基础配置
- `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`

#### [MODIFY] [.gitignore](file:///Users/keleya/Desktop/code/Multy/lost_cities/.gitignore)
- 添加 `dist/`、`tsconfig.tsbuildinfo` 等条目

#### [DELETE] [lan-start.sh](file:///Users/keleya/Desktop/code/Multy/lost_cities/lan-start.sh)
- 启动脚本将由根级 `npm run dev` 替代

---

### packages/shared — 共享类型与常量

从 `engine.js` 和 `App.jsx` 中提取共享的类型定义和常量，迁移为 TypeScript。

#### [NEW] [packages/shared/package.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/shared/package.json)
- `name: "@lost-cities/shared"`

#### [NEW] [packages/shared/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/shared/tsconfig.json)
- 继承 `tsconfig.base.json`，设置 `composite: true`

#### [NEW] [packages/shared/src/types.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/shared/src/types.ts)
提取所有共享类型定义（从 engine.js 和 App.jsx 中推导）：
- `Card` 接口（id, color, type, value）
- `Color` 类型
- `GameState`, `RoundState`, `PlayerView` 等接口
- `RoomState`, `RoomPlayer` 接口
- `GameAction` 联合类型（play_card, draw_card, continue_round）
- `ServerMessage`, `ClientMessage` 消息类型

#### [NEW] [packages/shared/src/constants.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/shared/src/constants.ts)
提取共享常量：
- `COLORS` 数组（`["red", "green", "blue", "yellow", "white"]`）
- `NUMBERS` 数组（`[2, 3, 4, 5, 6, 7, 8, 9, 10]`）
- `COLOR_DISPLAY_NAMES` 映射（红/绿/蓝/黄/白）
- `RULE_SECTIONS` 规则数据
- `QUICK_CHAT_MESSAGES` 快捷聊天消息

#### [NEW] [packages/shared/src/index.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/shared/src/index.ts)
- 统一导出 `types` 和 `constants`

---

### packages/game-logic — 游戏逻辑引擎

将 `server/src/engine.js` 的逻辑完整迁移为 TypeScript，按职责拆分为多个模块。**所有函数逻辑保持原样**。

#### [NEW] [packages/game-logic/package.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/package.json)
- `name: "@lost-cities/game-logic"`
- 依赖 `@lost-cities/shared`
- 添加 vitest 测试配置

#### [NEW] [packages/game-logic/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/tsconfig.json)
- 继承 `tsconfig.base.json`，引用 `../shared`

#### [NEW] [packages/game-logic/vitest.config.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/vitest.config.ts)

#### [NEW] [packages/game-logic/src/gameInit.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/gameInit.ts)
从 engine.js 迁移（逻辑不变，仅加类型）：
- `shuffle()` — 洗牌
- `createDeck()` — 创建牌组
- `dealHands()` — 发牌
- `createEmptyExpeditions()` — 创建空探险列
- `createEmptyDiscards()` — 创建空弃牌堆
- `createRoundState()` — 创建单局状态
- `createGameState()` — 创建游戏状态

#### [NEW] [packages/game-logic/src/gameActions.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/gameActions.ts)
从 engine.js 迁移：
- `canPlayToExpedition()` — 判断能否打入探险列
- `applyAction()` — 执行玩家动作（play_card / draw_card / continue_round）
- `getPlayerView()` — 生成玩家视角数据

#### [NEW] [packages/game-logic/src/gameScoring.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/gameScoring.ts)
从 engine.js 迁移：
- `scoreExpedition()` — 单色探险列计分
- `scoreAll()` — 全色计分
- `calcMatchWins()` — 计算比赛胜局
- `roundWinner()` — 判断单局胜者
- `isGameOver()` — 判断游戏是否结束

#### [NEW] [packages/game-logic/src/utils.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/utils.ts)
- `cloneState()` — 深拷贝状态
- `getTopDiscard()` — 获取弃牌堆顶牌

#### [NEW] [packages/game-logic/src/index.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/index.ts)
- 统一导出所有模块

#### [NEW] [packages/game-logic/src/\_\_tests\_\_/gameInit.test.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/__tests__/gameInit.test.ts)
- 测试牌组创建、发牌、初始状态

#### [NEW] [packages/game-logic/src/\_\_tests\_\_/gameActions.test.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/__tests__/gameActions.test.ts)
- 测试出牌、抽牌、继续下一局等动作

#### [NEW] [packages/game-logic/src/\_\_tests\_\_/gameScoring.test.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/game-logic/src/__tests__/gameScoring.test.ts)
- 测试计分逻辑

---

### packages/server — 服务端

将 `server/src/index.js` 和 `server/src/room.js` 迁移为 TypeScript，按 splendor-duel 的 server/roomManager/gameHandler/socketEvents 四文件结构拆分。**保留原生 WebSocket，不切换 socket.io**。

#### [NEW] [packages/server/package.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/package.json)
- `name: "@lost-cities/server"`
- 依赖 `@lost-cities/shared`, `@lost-cities/game-logic`, `ws`, `nanoid`
- 使用 `tsx watch` 开发

#### [NEW] [packages/server/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/tsconfig.json)
- 继承 `tsconfig.base.json`，引用 shared 和 game-logic

#### [NEW] [packages/server/src/server.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/src/server.ts)
- WebSocketServer 启动入口（从 index.js 提取）
- 调用 `setupSocketEvents(wss)`

#### [NEW] [packages/server/src/socketEvents.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/src/socketEvents.ts)
从 index.js 迁移所有消息处理逻辑：
- `room:create`, `room:join`, `room:reconnect` 处理
- `game:action`, `game:restart` 处理
- `room:chat` 处理
- `close` 事件处理
- `broadcastRoom()`, `broadcastEvent()`, `send()` 辅助函数

#### [NEW] [packages/server/src/roomManager.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/src/roomManager.ts)
从 room.js 迁移房间管理逻辑：
- `createRoom()`, `addPlayer()`, `removePlayer()`
- `reconnectPlayer()`, `pruneRoom()`
- `roomStateFor()`, `gameStateFor()`
- `handleAction()`, `restartRoom()`

#### [NEW] [packages/server/src/gameHandler.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/src/gameHandler.ts)
- 封装 `handleGameAction()`，调用 game-logic 的 `applyAction()`
- 验证玩家身份和游戏状态

---

### packages/client — 客户端

将 43KB 的 `App.jsx` 拆分为 pages/components/store/services 分层结构，迁移为 TypeScript。**所有 UI 逻辑和交互保持不变**。

#### [NEW] [packages/client/package.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/package.json)
- `name: "@lost-cities/client"`
- 依赖 `@lost-cities/shared`, `@lost-cities/game-logic`, `react`, `react-dom`, `zustand`, `immer`

#### [NEW] [packages/client/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/tsconfig.json)
- 继承 `tsconfig.base.json`，`jsx: react-jsx`

#### [NEW] [packages/client/vite.config.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/vite.config.ts)
- Vite 配置，端口 5173，WebSocket 代理到 server

#### [NEW] [packages/client/index.html](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/index.html)
- 从原有 index.html 迁移

#### [NEW] [packages/client/src/main.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/main.tsx)
- 入口文件

#### [NEW] [packages/client/src/App.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/App.tsx)
- 路由配置，Lobby 和 GamePage 两个页面

#### [NEW] [packages/client/src/services/socketService.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/services/socketService.ts)
从 App.jsx 提取 WebSocket 通信逻辑：
- `useSocket()` hook 或 SocketService 类
- `send()` 方法
- 消息监听和分发

#### [NEW] [packages/client/src/store/gameStore.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/store/gameStore.ts)
从 App.jsx 提取游戏状态管理（使用 zustand + immer）：
- `gameState`, `roomState` 状态
- `selectedCardId`, `phaseAction` 等 UI 状态
- `playCard()`, `drawCard()`, `continueRound()` 等动作
- `sortedHand`, `liveRoundScores`, `matchWins` 等计算属性

#### [NEW] [packages/client/src/store/roomStore.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/store/roomStore.ts)
从 App.jsx 提取房间状态管理：
- `roomState`, `reconnectToken`, `reconnectCode`
- `createRoom()`, `joinRoom()`, `reconnect()`, `leaveRoom()`
- `copyRoomCode()`, `copyInviteLink()`

#### [NEW] [packages/client/src/pages/Lobby.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/pages/Lobby.tsx)
从 App.jsx 提取大厅页面（约 L1000-L1100）：
- 服务器地址配置
- 创建/加入房间表单
- 断线重连按钮
- 创建房间弹窗、加入房间弹窗

#### [NEW] [packages/client/src/pages/GamePage.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/pages/GamePage.tsx)
从 App.jsx 提取游戏页面（约 L730-L1000 + L1110-L1220）：
- Header 区域（房间信息、比分、菜单）
- 游戏桌面布局（对手探险列、弃牌堆/抽牌堆、自己探险列、手牌区）
- 各种弹窗（规则、局结算、等待对手）

#### [NEW] [packages/client/src/components/Card.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/Card.tsx)
从 App.jsx 提取 `Card` 和 `HandCard` 组件

#### [NEW] [packages/client/src/components/ExpeditionRow.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/ExpeditionRow.tsx)
从 GamePage 提取探险列行组件

#### [NEW] [packages/client/src/components/DiscardPile.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/DiscardPile.tsx)
从 GamePage 提取弃牌堆组件

#### [NEW] [packages/client/src/components/HandZone.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/HandZone.tsx)
从 GamePage 提取手牌区组件

#### [NEW] [packages/client/src/components/RoundResultModal.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/RoundResultModal.tsx)
从 App.jsx 提取局结算弹窗

#### [NEW] [packages/client/src/components/RulesModal.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/RulesModal.tsx)
从 App.jsx 提取规则弹窗

#### [NEW] [packages/client/src/components/ChatPanel.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/ChatPanel.tsx)
从 App.jsx 提取聊天面板

#### [NEW] [packages/client/src/components/ActionHistory.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/ActionHistory.tsx)
从 App.jsx 提取操作历史面板

#### [NEW] [packages/client/src/components/ToastStack.tsx](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/components/ToastStack.tsx)
从 App.jsx 提取 Toast 提示组件

#### [NEW] [packages/client/src/styles/global.css](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/src/styles/global.css)
从原有 `styles.css` 迁移，保持所有样式不变

---

### 清理旧文件

#### [DELETE] [client/](file:///Users/keleya/Desktop/code/Multy/lost_cities/client)
- 删除旧的 client 目录

#### [DELETE] [server/](file:///Users/keleya/Desktop/code/Multy/lost_cities/server)
- 删除旧的 server 目录

---

## Verification Plan

### Automated Tests

```bash
# 安装依赖
cd lost_cities && npm install

# 运行游戏逻辑单元测试
npm run test

# TypeScript 类型检查
npm run build
```

### Manual Verification

- 启动 `npm run dev`，确认 server 和 client 均正常启动
- 打开浏览器创建房间、加入房间，验证双人对战流程
- 验证出牌、抽牌、弃牌、局结算、多局继续等所有游戏流程
- 验证聊天、操作历史、断线重连等辅助功能
- 验证邀请链接功能


---
生成时间: 2026/3/9 19:01:33
planId: 
plan_status: review