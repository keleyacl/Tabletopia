
# 花砖物语(Azul) 开发任务清单

## 1. 项目初始化
- [x] 初始化 monorepo 结构（根 package.json + npm workspaces）
- [x] 创建 `packages/shared` 子项目及 tsconfig
- [x] 创建 `packages/game-logic` 子项目及 tsconfig
- [x] 创建 `packages/server` 子项目及 tsconfig（Express + Socket.IO 依赖）
- [x] 创建 `packages/client` 子项目（Vite + React + TypeScript 初始化）
- [x] 安装所有依赖（zustand, immer, react-dnd, socket.io, socket.io-client 等）

## 2. 共享层 (packages/shared)
- [x] 实现 `types.ts`：TileColor 枚举、Factory 类型、PlayerBoard 接口、GameState 接口
- [x] 实现 `types.ts`：GameAction 联合类型、GameEvent 联合类型（Socket 通信协议）
- [x] 实现 `constants.ts`：墙面颜色映射矩阵、地板线扣分数组、游戏常量
- [x] 实现 `index.ts`：统一导出

## 3. 游戏逻辑层 (packages/game-logic)
- [x] 实现 `gameInit.ts`：createInitialBag、shuffleBag（Fisher-Yates）、refillBagFromDiscard
- [x] 实现 `gameInit.ts`：fillFactories、initializeGame 函数
- [x] 实现 `gameActions.ts`：validatePlacement 合法性校验
- [x] 实现 `gameActions.ts`：takeTilesFromFactory、takeTilesFromCenter
- [x] 实现 `gameActions.ts`：placeTilesOnPatternLine、handleFirstPlayerMarker
- [x] 实现 `gameScoring.ts`：calculateTileScore（连通计分算法）
- [x] 实现 `gameScoring.ts`：calculateFloorPenalty、tilePatternLineToWall
- [x] 实现 `gameScoring.ts`：scoreRound 回合计分主函数
- [x] 实现 `gameScoring.ts`：calculateEndGameBonus、checkGameEnd
- [x] 实现 `index.ts`：统一导出
- [x] 编写游戏逻辑单元测试（初始化、拿砖、计分、终局）

## 4. 后端服务 (packages/server)
- [x] 实现 `server.ts`：Express + Socket.IO 服务入口
- [x] 实现 `roomManager.ts`：createRoom、joinRoom、leaveRoom、getRoomState
- [x] 实现 `gameHandler.ts`：handleStartGame、handleTakeTiles、handleEndRound
- [x] 实现 `socketEvents.ts`：Socket.IO 事件注册、连接管理、心跳检测

## 5. 前端状态管理与通信
- [x] 实现 `socketService.ts`：Socket.IO 客户端封装（连接、事件、重连）
- [x] 实现 `gameStore.ts`：Zustand 游戏状态 store（immer 中间件）
- [x] 实现 `roomStore.ts`：Zustand 房间状态 store

## 6. 前端页面与路由
- [x] 实现 `main.tsx`：应用入口（DndProvider 包裹）
- [x] 实现 `App.tsx`：路由配置（大厅页 + 游戏页）
- [x] 实现 `Lobby.tsx`：大厅页面（创建/加入房间、玩家列表、开始按钮）

## 7. 前端核心组件
- [x] 实现 `Tile.tsx`：单块瓷砖组件（颜色渲染 + DragSource）
- [x] 实现 `Factory.tsx`：单个工厂组件（4 块瓷砖展示 + 拖拽源）
- [x] 实现 `CenterPot.tsx`：中心区域组件（瓷砖展示 + 拖拽源）
- [x] 实现 `FactoryCircle.tsx`：工厂环形区域组件（环形布局）
- [x] 实现 `PatternLines.tsx`：模式线组件（阶梯状 + DropTarget + 高亮）
- [x] 实现 `Wall.tsx`：墙面组件（5x5 Grid + 半透明背景 + 循环位移颜色）
- [x] 实现 `FloorLine.tsx`：地板线组件（扣分展示）
- [x] 实现 `PlayerBoard.tsx`：玩家板组件（组合模式线、墙面、地板线）
- [x] 实现 `ScoreBoard.tsx`：计分板组件
- [x] 实现 `GamePage.tsx`：游戏主页面（组合所有游戏组件）
- [x] 实现 `GameOverModal.tsx`：游戏结束弹窗

## 8. 样式与视觉
- [x] 实现 `global.css`：全局样式、CSS 变量（瓷砖颜色）
- [x] 实现 `components.css`：组件布局样式（环形工厂、阶梯模式线、Grid 墙面）

## 9. 联调与测试
- [ ] 前后端联调：房间创建/加入/开始游戏流程
- [ ] 前后端联调：完整游戏对局流程（拿砖→放置→计分→终局）
- [ ] 边界情况测试：袋子回收、地板线溢出、起始标记、断线重连


---
生成时间: 2026/3/9 15:00:55
planId: 