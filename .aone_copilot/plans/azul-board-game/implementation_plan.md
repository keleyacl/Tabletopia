
# 数字版《花砖物语》(Azul) 全栈开发计划

## User Review Required

> [!IMPORTANT]
> 本项目需要后端联机服务支持，计划使用 **Node.js + Express + Socket.IO** 作为后端技术栈。如果你有其他后端偏好（如 Go、Python 等），请在确认前告知。

> [!WARNING]
> 项目将使用 `create-react-app` 或 `Vite` 初始化前端项目。计划使用 **Vite**（更快的构建速度），如有异议请提前说明。

## Proposed Changes

### 项目初始化与基础配置

#### [NEW] package.json(file:///Users/keleya/Desktop/code/Multy/huazhuan/package.json)
Monorepo 根配置，使用 npm workspaces 管理前后端子项目。

#### [NEW] tsconfig.base.json(file:///Users/keleya/Desktop/code/Multy/huazhuan/tsconfig.base.json)
共享的 TypeScript 基础配置。

---

### 共享层 (packages/shared) - 前后端共用的类型与常量

#### [NEW] index.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/shared/src/index.ts)
统一导出入口。

#### [NEW] types.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/shared/src/types.ts)
核心数据结构定义：
- `TileColor` 枚举（Blue, Yellow, Red, Black, White, FirstPlayer）
- `Factory` 类型
- `PlayerBoard` 接口（patternLines, wall, floorLine, score）
- `GameState` 接口（players, factories, centerPot, bag, discardPile, phase）
- `GameAction` 联合类型（玩家操作的消息协议）
- `GameEvent` 联合类型（服务端推送的事件协议）

#### [NEW] constants.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/shared/src/constants.ts)
游戏常量定义：
- 墙面颜色映射矩阵 `WALL_PATTERN`（循环位移公式 `(colorIndex + rowIndex) % 5`）
- 地板线扣分数组 `FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3]`
- 每种颜色瓷砖总数 `TILES_PER_COLOR = 20`
- 工厂瓷砖数 `TILES_PER_FACTORY = 4`
- 终局加分规则常量

---

### 游戏逻辑层 (packages/game-logic) - 纯函数，前后端共用

#### [NEW] gameInit.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/game-logic/src/gameInit.ts)
游戏初始化逻辑：
- `createInitialBag()`: 创建 100 块瓷砖的初始袋子（每色 20 块）
- `shuffleBag()`: Fisher-Yates 洗牌算法
- `refillBagFromDiscard()`: 袋子为空时从弃置堆回收
- `fillFactories()`: 根据玩家人数 N 创建 2N+1 个工厂，每个填充 4 块
- `initializeGame(playerNames: string[])`: 总初始化函数

#### [NEW] gameActions.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/game-logic/src/gameActions.ts)
玩家行动逻辑：
- `takeTilesFromFactory(state, playerId, factoryIndex, color, targetLineIndex)`: 从工厂拿砖
- `takeTilesFromCenter(state, playerId, color, targetLineIndex)`: 从中心拿砖
- `validatePlacement(player, color, targetLineIndex)`: 放置合法性校验
  - 检查行是否为空或同色
  - 检查墙面对应行是否已有该颜色
- `placeTilesOnPatternLine()`: 放置瓷砖，溢出进地板线
- `handleFirstPlayerMarker()`: 首个拿中心的玩家获得起始标记

#### [NEW] gameScoring.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/game-logic/src/gameScoring.ts)
计分逻辑（核心难点）：
- `scoreRound(state)`: 回合结束计分主函数
- `tilePatternLineToWall(player, rowIndex)`: 将填满的模式线移至墙面
- `calculateTileScore(wall, row, col)`: 单块瓷砖的连通计分
  - 水平方向连续瓷砖数 H
  - 垂直方向连续瓷砖数 V
  - 得分 = H > 1 || V > 1 ? H + V : 1
- `calculateFloorPenalty(floorLine)`: 地板线扣分
- `calculateEndGameBonus(player)`: 终局额外加分
  - 完整行 +2，完整列 +7，全色 +10
- `checkGameEnd(state)`: 检查是否有玩家完成一整行

#### [NEW] index.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/game-logic/src/index.ts)
统一导出。

---

### 后端服务 (packages/server) - WebSocket 联机

#### [NEW] server.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/server/src/server.ts)
Express + Socket.IO 服务入口：
- HTTP 服务（端口 3001）
- CORS 配置
- Socket.IO 初始化

#### [NEW] roomManager.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/server/src/roomManager.ts)
房间管理：
- `createRoom(hostName)`: 创建房间，返回房间 ID
- `joinRoom(roomId, playerName)`: 加入房间（2-4 人限制）
- `leaveRoom(roomId, playerId)`: 离开房间
- `getRoomState(roomId)`: 获取房间状态
- 内存存储房间数据（Map 结构）

#### [NEW] gameHandler.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/server/src/gameHandler.ts)
游戏事件处理：
- `handleStartGame`: 房主开始游戏，调用 gameInit
- `handleTakeTiles`: 处理玩家拿砖操作，调用 gameActions
- `handleEndRound`: 回合结束触发计分，调用 gameScoring
- 广播状态更新给房间内所有玩家
- 回合超时处理

#### [NEW] socketEvents.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/server/src/socketEvents.ts)
Socket.IO 事件注册与路由：
- 连接/断开处理
- 房间事件（create, join, leave, start）
- 游戏事件（takeTiles, endTurn）
- 心跳检测与断线重连

---

### 前端应用 (packages/client) - React + Vite

#### [NEW] vite.config.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/vite.config.ts)
Vite 配置，代理 WebSocket 到后端。

#### [NEW] index.html(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/index.html)
HTML 入口文件。

#### [NEW] main.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/main.tsx)
React 应用入口，包裹 DndProvider。

#### [NEW] App.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/App.tsx)
路由配置：
- `/` - 大厅页面（创建/加入房间）
- `/game/:roomId` - 游戏页面

---

#### 状态管理 (Zustand Store)

#### [NEW] gameStore.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/store/gameStore.ts)
Zustand 游戏状态管理（使用 immer 中间件）：
- `gameState`: 同步服务端的游戏状态
- `selectedTiles`: 当前选中的瓷砖信息
- `validPlacements`: 合法放置位置高亮
- `myPlayerId`: 当前玩家 ID
- Actions: `selectTiles`, `placeTiles`, `clearSelection`

#### [NEW] roomStore.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/store/roomStore.ts)
房间状态管理：
- `roomId`, `players`, `isHost`, `gameStarted`
- Actions: `createRoom`, `joinRoom`, `startGame`

---

#### Socket 通信层

#### [NEW] socketService.ts(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/services/socketService.ts)
Socket.IO 客户端封装：
- 连接管理（connect, disconnect, reconnect）
- 事件发送与监听
- 与 Zustand store 的状态同步桥接

---

#### UI 组件

#### [NEW] Lobby.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/pages/Lobby.tsx)
大厅页面：创建房间、输入房间号加入、玩家列表、开始游戏按钮。

#### [NEW] GamePage.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/pages/GamePage.tsx)
游戏主页面：组合工厂区、玩家板、计分板等组件。

#### [NEW] FactoryCircle.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/FactoryCircle.tsx)
工厂环形区域组件：
- 环形布局展示所有工厂
- 中心放置 centerPot
- 每个工厂展示 4 块瓷砖
- 点击某色瓷砖触发选择

#### [NEW] Factory.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/Factory.tsx)
单个工厂组件：展示 4 块瓷砖，支持 React-DnD 拖拽源。

#### [NEW] CenterPot.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/CenterPot.tsx)
中心区域组件：展示被移入中心的瓷砖，支持拖拽源。

#### [NEW] Tile.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/Tile.tsx)
单块瓷砖组件：
- 根据 TileColor 渲染对应颜色
- 作为 React-DnD 的 DragSource
- 拖拽时显示预览

#### [NEW] PlayerBoard.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/PlayerBoard.tsx)
玩家板组件（核心 UI）：
- 左侧：PatternLines（1-5 阶梯状，CSS Grid）
- 右侧：Wall（5x5 网格，半透明背景色）
- 底部：FloorLine（最多 7 格）
- 顶部：玩家名称和分数

#### [NEW] PatternLines.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/PatternLines.tsx)
模式线组件：
- 5 行阶梯状排列（右对齐）
- 作为 React-DnD 的 DropTarget
- 合法放置位置高亮显示

#### [NEW] Wall.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/Wall.tsx)
墙面组件：
- 5x5 CSS Grid
- 预印半透明背景色（按循环位移规则）
- 已放置的瓷砖显示实色

#### [NEW] FloorLine.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/FloorLine.tsx)
地板线组件：展示扣分瓷砖和对应扣分值。

#### [NEW] ScoreBoard.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/ScoreBoard.tsx)
计分板组件：展示所有玩家分数排名。

#### [NEW] GameOverModal.tsx(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/components/GameOverModal.tsx)
游戏结束弹窗：展示最终排名和额外加分明细。

---

#### 样式

#### [NEW] global.css(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/styles/global.css)
全局样式：背景色、字体、CSS 变量（瓷砖颜色映射）。

#### [NEW] components.css(file:///Users/keleya/Desktop/code/Multy/huazhuan/packages/client/src/styles/components.css)
组件样式：工厂环形布局、玩家板 Grid 布局、瓷砖样式、动画效果。

---

## Verification Plan

### Automated Tests
- 游戏逻辑层单元测试（使用 Vitest）：
  - `npm run test -w packages/game-logic`
  - 覆盖初始化、拿砖验证、计分算法、终局判定
- 前端组件渲染测试（可选）

### Manual Verification
1. 启动后端服务：`npm run dev -w packages/server`
2. 启动前端应用：`npm run dev -w packages/client`
3. 打开两个浏览器窗口，分别创建/加入同一房间
4. 验证完整游戏流程：
   - 创建房间 → 加入房间 → 开始游戏
   - 从工厂/中心拿砖 → 放置到模式线
   - 回合结束自动计分
   - 游戏结束显示最终排名
5. 验证边界情况：
   - 袋子抽空后从弃置堆回收
   - 地板线溢出扣分
   - 首个拿中心的玩家获得起始标记


---
生成时间: 2026/3/9 15:00:55
planId: 
plan_status: review