# 璀璨宝石·对决 (Splendor Duel) 完整开发计划

## Proposed Changes

项目在 `gem/` 目录下创建，沿用 `huazhuan` 的 monorepo 结构，包名前缀为 `@splendor`。

---

### 1. 项目脚手架与基础配置

搭建 monorepo 工程结构，包含根 package.json、tsconfig.base.json 及四个子包的基础配置。

#### [NEW] [package.json](file:///Users/keleya/Desktop/code/Multy/gem/package.json)
根 package.json，定义 workspaces 为 `packages/shared`、`packages/game-logic`、`packages/server`、`packages/client`，配置 `dev`、`build`、`test` 等脚本，devDependencies 包含 `concurrently` 和 `typescript`。

#### [NEW] [tsconfig.base.json](file:///Users/keleya/Desktop/code/Multy/gem/tsconfig.base.json)
沿用 huazhuan 的 base tsconfig 配置（target ES2020, strict mode, ESNext module）。

#### [NEW] [packages/shared/package.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/package.json)
`@splendor/shared` 包配置。

#### [NEW] [packages/shared/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/tsconfig.json)
继承 base tsconfig。

#### [NEW] [packages/game-logic/package.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/package.json)
`@splendor/game-logic` 包配置，依赖 `@splendor/shared`，devDependencies 包含 `vitest`。

#### [NEW] [packages/game-logic/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/tsconfig.json)
继承 base tsconfig，引用 shared。

#### [NEW] [packages/game-logic/vitest.config.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/vitest.config.ts)
Vitest 配置，设置 alias 解析 `@splendor/shared`。

#### [NEW] [packages/client/package.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/package.json)
`@splendor/client` 包配置，依赖 react、react-dom、zustand、immer、socket.io-client、tailwindcss 等。

#### [NEW] [packages/client/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/tsconfig.json)
继承 base tsconfig，启用 jsx，引用 shared 和 game-logic。

#### [NEW] [packages/client/vite.config.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/vite.config.ts)
Vite 配置，包含 react 插件、tailwindcss 插件、端口 3002（避免与 huazhuan 冲突）、socket.io 代理。

#### [NEW] [packages/client/tailwind.config.js](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/tailwind.config.js)
Tailwind CSS 配置，定义宝石颜色主题（白/蓝/绿/红/黑/珍珠/金）的自定义色值和渐变。

#### [NEW] [packages/client/postcss.config.js](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/postcss.config.js)
PostCSS 配置，启用 tailwindcss 和 autoprefixer。

#### [NEW] [packages/client/index.html](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/index.html)
HTML 入口文件，标题为"璀璨宝石·对决"。

#### [NEW] [packages/server/package.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/package.json)
`@splendor/server` 包配置，依赖 express、socket.io、cors、uuid，devDependencies 包含 tsx。

#### [NEW] [packages/server/tsconfig.json](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/tsconfig.json)
继承 base tsconfig，使用 CommonJS module，引用 shared 和 game-logic。

---

### 2. Shared 包 - 核心类型与常量

定义所有共享的 TypeScript 类型、枚举和游戏常量。

#### [NEW] [types.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/src/types.ts)
核心类型定义，包含：
- `GemType` 枚举（White, Blue, Green, Red, Black, Pearl, Gold）
- `CardAbility` 枚举（ExtraTurn, TakeToken, TakePrivilege, CopyColor, RobToken）
- `Card` 接口（id, level, cost, points, crowns, bonus, ability）
- `BoardSlot` 接口（x, y, gem）
- `Coord` 类型（{x: number, y: number}）
- `Player` 接口（id, inventory, bonuses, privileges, reservedCards, purchasedCards, crowns, score, scoresByColor）
- `GameState` 接口（board, bag, privilegePool, decks, display, players, currentPlayerIndex, turnPhase, winner, pendingAbility）
- `TurnPhase` 类型（'OptionalBefore' | 'Main' | 'OptionalAfter' | 'ResolveAbilities' | 'DiscardExcess'）
- `GameAction` 联合类型（TakeTokens, ReserveCard, PurchaseCard, UsePrivilege, RefillBoard, DiscardTokens, ResolveAbility）

#### [NEW] [constants.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/src/constants.ts)
游戏常量定义：
- `BOARD_SIZE = 5`
- `MAX_TOKENS = 10`（玩家宝石上限）
- `MAX_GOLD = 3`（黄金上限）
- `MAX_RESERVED = 3`（预留卡牌上限）
- `INITIAL_PRIVILEGES = 3`（初始特权卷轴数）
- `PEARL_COUNT = 2`（珍珠总数）
- `GOLD_COUNT = 3`（黄金总数）
- `GEM_COUNTS`：各类宝石在袋中的初始数量
- `SPIRAL_ORDER`：5x5 棋盘从中心向外的螺旋坐标序列
- `VICTORY_SCORE = 20`、`VICTORY_CROWNS = 10`、`VICTORY_COLOR_SCORE = 10`
- `CARDS_PER_LEVEL_DISPLAY`：每级展示区的卡牌数量

#### [NEW] [index.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/src/index.ts)
统一导出 types 和 constants。

---

### 3. Shared 包 - 卡牌数据

根据《璀璨宝石：对决》桌游规则，生成一套完整且平衡的卡牌数据。

#### [NEW] [cardData.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/shared/src/cardData.ts)
完整卡牌数据集，包含三个等级的卡牌：
- **Level 1**（约 25 张）：低费用（1-3 宝石），0-1 分，0-1 皇冠，部分带 TakeToken/TakePrivilege 能力
- **Level 2**（约 23 张）：中等费用（3-6 宝石），1-3 分，0-2 皇冠，部分带 ExtraTurn/CopyColor 能力
- **Level 3**（约 15 张）：高费用（5-9 宝石），3-5 分，1-3 皇冠，部分带 RobToken/ExtraTurn 能力

每张卡牌包含 id、level、cost、points、crowns、bonus（颜色或 Wild）、ability 字段。数据设计遵循：
- 珍珠不出现在 bonus 中（稀缺资源）
- 黄金不出现在 cost 中（只作为万能替代）
- 能力分布均匀，高级卡牌能力更强

---

### 4. Game Logic 包 - 棋盘几何引擎

实现 5x5 棋盘的核心逻辑。

#### [NEW] [boardLogic.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/boardLogic.ts)
棋盘逻辑模块：
- `createEmptyBoard()`: 创建 5x5 空棋盘
- `validateSelection(board, coords)`: 校验选中的 1-3 个坐标是否共线（水平/垂直/对角线）且相邻无空位，且不包含 Gold
- `removeGemsFromBoard(board, coords)`: 从棋盘移除选中宝石
- `refillBoard(board, bag)`: 按 SPIRAL_ORDER 从袋中取宝石填充空位
- `getBoardGemCount(board)`: 统计棋盘上的宝石数量
- `checkSameColorCount(coords, board)`: 检查选中宝石中同色数量（用于触发特权）

辅助函数：
- `areCollinear(coords)`: 判断坐标是否共线
- `areAdjacent(coords)`: 判断坐标是否相邻且连续
- `hasNoGapsBetween(board, coords)`: 判断坐标间无空位

---

### 5. Game Logic 包 - 经济核算引擎

实现资源消耗与购买逻辑。

#### [NEW] [economyEngine.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/economyEngine.ts)
经济引擎模块：
- `canAfford(player, card)`: 判断玩家是否能购买卡牌（考虑 bonuses 折扣和 gold 替代）
- `calculateCost(player, card)`: 计算实际需要支付的宝石（扣除 bonuses 后的净费用）
- `calculateGoldNeeded(player, card)`: 计算需要多少黄金补齐
- `executePurchase(state, playerIndex, cardId)`: 执行购买：扣除宝石、更新 bonuses/score/crowns/scoresByColor、处理 ability 触发
- `returnTokensToBag(bag, tokens)`: 将消耗的宝石放回袋子

---

### 6. Game Logic 包 - 特殊能力处理器

处理卡牌能力的触发与解决。

#### [NEW] [abilityEngine.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/abilityEngine.ts)
能力处理模块：
- `triggerAbility(state, card)`: 根据卡牌能力类型设置 `pendingAbility` 状态
- `resolveAbility(state, action)`: 解决待处理的能力效果
  - **TakeToken**: 从棋盘取 1 个与卡牌同色的宝石
  - **TakePrivilege**: 获得 1 个特权卷轴
  - **CopyColor**: 选择复制另一张已购卡牌的颜色作为额外 bonus
  - **RobToken**: 从对手处抢夺 1 个非黄金宝石
  - **ExtraTurn**: 标记当前玩家获得额外回合

---

### 7. Game Logic 包 - 回合状态机与游戏流程

实现完整的回合控制和游戏初始化。

#### [NEW] [gameInit.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/gameInit.ts)
游戏初始化模块：
- `createInitialState()`: 创建初始游戏状态
  - 洗牌并分配卡牌到 decks 和 display
  - 初始化宝石袋（按 GEM_COUNTS 填充并洗牌）
  - 按 SPIRAL_ORDER 填充棋盘
  - 初始化两个玩家的空状态
  - 设置 privilegePool = 3
- `createEmptyPlayer(id)`: 创建空玩家状态
- `shuffleArray(arr)`: Fisher-Yates 洗牌算法

#### [NEW] [turnManager.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/turnManager.ts)
回合管理模块（状态机驱动）：
- `advancePhase(state)`: 推进回合阶段
  - OptionalBefore -> Main（可选使用特权）
  - Main -> OptionalAfter/ResolveAbilities（执行主动作后）
  - ResolveAbilities -> OptionalAfter（能力解决后）
  - OptionalAfter -> DiscardExcess/EndTurn（检查库存上限）
  - DiscardExcess -> EndTurn（丢弃多余宝石后）
- `endTurn(state)`: 结束回合，切换玩家（除非 ExtraTurn）
- `canUsePrivilege(state)`: 判断当前阶段是否可使用特权

#### [NEW] [gameActions.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/gameActions.ts)
玩家动作处理模块：
- `takeTokens(state, coords)`: 校验并执行拿取宝石
  - 调用 boardLogic.validateSelection 校验
  - 检查 3 个同色宝石触发对手获得特权
  - 更新玩家 inventory 和棋盘
- `reserveCard(state, cardId)`: 预留卡牌
  - 检查预留上限（3 张）
  - 从 display 或 deck 顶部取卡
  - 如果棋盘上有 Gold 且玩家 Gold < 3，获得 1 个 Gold
- `purchaseCard(state, cardId)`: 购买卡牌（委托 economyEngine）
- `usePrivilege(state, coord)`: 使用特权卷轴拿取 1 个非黄金宝石
- `refillBoard(state)`: 重置棋盘并给对手 1 个特权卷轴
- `discardTokens(state, tokens)`: 丢弃多余宝石至上限

#### [NEW] [victoryMonitor.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/victoryMonitor.ts)
胜利判定模块：
- `checkVictory(player)`: 检查三种胜利条件
  - 总分 >= 20
  - 皇冠数 >= 10
  - 某一颜色的卡牌分数之和 >= 10
- `getVictoryType(player)`: 返回胜利类型（'score' | 'crowns' | 'color' | null）

#### [NEW] [index.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/index.ts)
统一导出所有模块。

---

### 8. Game Logic 包 - 单元测试

为核心逻辑编写测试。

#### [NEW] [boardLogic.test.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/__tests__/boardLogic.test.ts)
棋盘逻辑测试：
- 测试共线判定（水平/垂直/对角线/非共线）
- 测试相邻判定（连续/有间隔）
- 测试 Gold 选取限制
- 测试螺旋填充顺序

#### [NEW] [economyEngine.test.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/__tests__/economyEngine.test.ts)
经济引擎测试：
- 测试 canAfford 在各种场景下的判定
- 测试 bonus 折扣计算
- 测试 gold 替代逻辑
- 测试购买后状态更新

#### [NEW] [gameActions.test.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/__tests__/gameActions.test.ts)
动作测试：
- 测试拿取宝石的各种合法/非法场景
- 测试预留卡牌逻辑
- 测试特权使用
- 测试棋盘重置触发特权

#### [NEW] [victoryMonitor.test.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/game-logic/src/__tests__/victoryMonitor.test.ts)
胜利判定测试：三种胜利条件的边界测试。

---

### 9. Client 包 - 状态管理

使用 Zustand 管理前端游戏状态。

#### [NEW] [gameStore.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/store/gameStore.ts)
游戏状态 Store：
- 持有完整 `GameState`
- 封装所有动作方法（takeTokens, reserveCard, purchaseCard, usePrivilege, refillBoard, discardTokens, resolveAbility）
- 使用 immer middleware 实现不可变更新
- 支持选中宝石的临时状态（selectedCoords）
- 支持 UI 交互状态（highlightedSlots, showDiscardModal 等）

#### [NEW] [roomStore.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/store/roomStore.ts)
房间状态 Store：管理 socket 连接、房间创建/加入、玩家匹配状态。

---

### 10. Client 包 - UI 组件（精致华丽风格）

使用 React + Tailwind CSS 构建精致华丽的游戏界面。

#### [NEW] [main.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/main.tsx)
React 入口文件，挂载 App 组件。

#### [NEW] [App.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/App.tsx)
根组件，包含路由（首页/游戏页/房间页）。

#### [NEW] [globals.css](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/styles/globals.css)
全局样式：Tailwind 指令、宝石光效动画（@keyframes shimmer, glow, pulse）、渐变背景、自定义字体。

#### [NEW] [GamePage.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/pages/GamePage.tsx)
游戏主页面，布局：
- 顶部：对手状态栏
- 中间左：5x5 棋盘 + 宝石袋信息
- 中间右：三级卡牌展示区
- 底部：当前玩家状态栏
- 浮层：特权卷轴、操作按钮

#### [NEW] [GemBoard.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/GemBoard.tsx)
5x5 棋盘组件：
- 网格布局展示 25 个槽位
- 宝石使用渐变色 + 光效 + 阴影模拟质感
- 点击多选逻辑，选中宝石高亮发光
- 空位显示暗色凹槽
- 确认选取按钮

#### [NEW] [GemToken.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/GemToken.tsx)
单个宝石 Token 组件：
- 根据 GemType 渲染不同颜色的圆形宝石
- 渐变填充 + 内发光 + 外阴影
- 选中态：放大 + 脉冲光效
- 珍珠：特殊的珠光渐变
- 黄金：金属质感渐变

#### [NEW] [CardDisplay.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/CardDisplay.tsx)
三级卡牌展示区组件：
- 三行展示 Level 1/2/3 的卡牌
- 每行显示 display 中的卡牌 + 牌堆剩余数量
- 卡牌可点击（购买/预留）

#### [NEW] [CardItem.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/CardItem.tsx)
单张卡牌组件：
- 卡面展示：分数、皇冠、费用、bonus 颜色、能力图标
- 华丽边框（根据等级不同：铜/银/金）
- 悬停效果：微微抬起 + 发光
- 可购买态：绿色边框高亮
- 能力图标使用 emoji 或 SVG

#### [NEW] [PlayerPanel.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/PlayerPanel.tsx)
玩家状态面板：
- 玩家名称和头像区
- 宝石库存（各色宝石数量，圆形 token 展示）
- 永久 bonus 展示
- 皇冠数量（金色皇冠图标）
- 分数显示
- 预留卡牌区（最多 3 张，背面朝上可翻看）
- 特权卷轴数量

#### [NEW] [PrivilegeToken.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/PrivilegeToken.tsx)
特权卷轴组件：卷轴造型，金色边框，使用时的消耗动画。

#### [NEW] [ActionBar.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/ActionBar.tsx)
操作栏组件：
- 确认拿取宝石按钮
- 重置棋盘按钮
- 结束回合按钮
- 当前回合阶段提示

#### [NEW] [DiscardModal.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/DiscardModal.tsx)
丢弃宝石弹窗：当玩家宝石超过 10 个时弹出，选择丢弃哪些宝石。

#### [NEW] [AbilityResolver.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/AbilityResolver.tsx)
能力解决组件：根据 pendingAbility 类型显示不同的交互界面（选宝石/选对手宝石/选卡牌颜色）。

#### [NEW] [VictoryOverlay.tsx](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/components/VictoryOverlay.tsx)
胜利弹窗：华丽的胜利动画，显示胜利类型和最终分数。

---

### 11. Client 包 - Socket 服务

#### [NEW] [socketService.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/client/src/services/socketService.ts)
Socket.IO 客户端服务：连接管理、事件监听、动作发送。

---

### 12. Server 包 - 后端服务

#### [NEW] [server.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/src/server.ts)
Express + Socket.IO 服务器入口，监听端口 3003。

#### [NEW] [roomManager.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/src/roomManager.ts)
房间管理：创建房间、加入房间、房间状态维护。

#### [NEW] [gameHandler.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/src/gameHandler.ts)
游戏处理器：接收客户端动作、调用 game-logic 处理、广播状态更新。

#### [NEW] [socketEvents.ts](file:///Users/keleya/Desktop/code/Multy/gem/packages/server/src/socketEvents.ts)
Socket 事件定义与处理逻辑。

---

## User Review Required

> [!IMPORTANT]
> **卡牌数据平衡性**：将根据桌游规则自动生成约 63 张卡牌（Level 1: 25张, Level 2: 23张, Level 3: 15张）。生成后建议人工审核数据的平衡性。

> [!WARNING]
> **Tailwind CSS 版本**：将使用 Tailwind CSS v4（最新版），配置方式与 v3 有所不同，使用 `@tailwindcss/vite` 插件集成。

> [!NOTE]
> **端口分配**：client 使用 3002 端口，server 使用 3003 端口，避免与 huazhuan 项目（3000/3001）冲突。

## Verification Plan

### Automated Tests
- `cd gem && npm install`：验证依赖安装
- `npm run test -w packages/game-logic`：运行 vitest 单元测试
- `npm run build`：验证全链路 TypeScript 编译
- `npm run dev:client`：启动前端开发服务器，验证 UI 渲染
- `npm run dev:server`：启动后端服务器，验证 socket 连接

### Manual Verification
- 在浏览器中打开 `http://localhost:3002`，验证游戏界面渲染
- 测试 5x5 棋盘的宝石多选交互
- 测试购买卡牌流程
- 测试特权卷轴使用
- 测试胜利判定弹窗


---
生成时间: 2026/3/9 16:41:56
planId: 
plan_status: review