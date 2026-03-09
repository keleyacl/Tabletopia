
# 编写 Tabletopia 项目规范文档

为 Tabletopia 桌游合集项目创建一套全面的项目规范文档，存放在 `docs/` 目录下。规范文档将基于对现有三个游戏项目（Azul、Splendor Duel、Lost Cities）和 Portal 聚合首页的深入调研，提炼出统一的架构模式和编码约定。

## Proposed Changes

### 文档目录结构

#### [NEW] [README.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/README.md)
文档索引页，列出所有规范文档及其简要说明，方便快速导航。

---

### 项目架构规范

#### [NEW] [architecture.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/architecture.md)
项目整体架构规范，包含：
- **Monorepo 架构**：npm workspaces 管理，每个游戏独立子项目
- **四层分包架构**：`shared` → `game-logic` → `server` → `client` 的依赖关系
- **Portal 聚合层**：聚合首页的定位和职责
- **端口分配规则**：Client 端口从 3000 起步，每个游戏占用 2 个连续端口（client + server），Portal 固定 4000
- **通信架构**：WebSocket 实时通信模式（推荐 Socket.IO）

```
Tabletopia/
├── portal/              # 聚合首页（端口 4000）
├── <game-name>/         # 游戏子项目
│   ├── packages/
│   │   ├── shared/      # 共享类型与常量
│   │   ├── game-logic/  # 纯函数游戏逻辑
│   │   ├── server/      # WebSocket 服务端
│   │   └── client/      # React 客户端
│   ├── package.json
│   └── tsconfig.base.json
├── run.sh
├── stop.sh
├── docs/                # 项目规范文档
└── README.md
```

---

### 技术选型规范

#### [NEW] [tech-stack.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/tech-stack.md)
统一技术栈规范，包含：
- **语言**：TypeScript（全栈，strict 模式）
- **前端**：React 18 + Vite + Zustand + Immer
- **后端**：Express + Socket.IO（推荐）/ 原生 WebSocket
- **路由**：React Router DOM
- **测试**：Vitest
- **构建**：Vite（client）、tsx watch（server）
- **包管理**：npm workspaces
- **并发启动**：concurrently
- 各依赖的推荐版本范围
- 禁止引入的技术（如 CSS-in-JS 框架混用等）

---

### 代码规范

#### [NEW] [code-style.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/code-style.md)
编码风格和命名规范，包含：

**文件命名**：
- TypeScript 文件：`camelCase.ts`（如 `gameInit.ts`、`roomManager.ts`）
- React 组件：`PascalCase.tsx`（如 `PlayerBoard.tsx`、`GameOverModal.tsx`）
- 测试文件：`<source>.test.ts`（如 `gameInit.test.ts`）
- 样式文件：`camelCase.css` 或 `components.css`

**类型命名**：
- 接口/类型：`PascalCase`（如 `GameState`、`PlayerBoard`）
- 枚举：`PascalCase`（如 `TileColor`、`GamePhase`）

**函数命名**：
- 动词开头 `camelCase`（如 `createRoom`、`takeTilesFromFactory`）
- 布尔返回值：`is/has/can` 前缀（如 `isPickingPhaseOver`）

**变量命名**：
- 普通变量：`camelCase`（如 `myPlayerId`）
- 常量：`UPPER_SNAKE_CASE`（如 `TILES_PER_COLOR`）

**Socket 事件命名**：
- 格式：`namespace:action`
- 客户端发送：`room:create`、`game:takeFromFactory`
- 服务端推送：`room:created`、`game:stateUpdated`

**代码组织原则**：
- `game-logic` 包必须是纯函数，无副作用，不依赖 Node.js 或浏览器 API
- `shared` 包只包含类型定义和常量，不包含逻辑
- 状态管理使用 Zustand + Immer，按职责拆分 store（`gameStore` + `roomStore`）
- Socket 服务封装为单例模式

---

### 新游戏接入指南

#### [NEW] [new-game-guide.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/new-game-guide.md)
新游戏开发接入的完整指南，包含：

1. **创建项目骨架**：
   - 目录结构模板
   - `package.json` 模板（含 workspaces 配置）
   - `tsconfig.base.json` 模板
   - 各子包的 `package.json` 和 `tsconfig.json` 模板

2. **实现 shared 包**：
   - `types.ts`：定义游戏状态、玩家状态、动作类型等核心类型
   - `constants.ts`：定义游戏常量
   - `index.ts`：统一导出

3. **实现 game-logic 包**：
   - `gameInit.ts`：游戏初始化逻辑
   - `gameActions.ts`：玩家动作处理
   - `gameScoring.ts`：计分逻辑
   - `__tests__/`：单元测试
   - `vitest.config.ts`：测试配置

4. **实现 server 包**：
   - `server.ts`：Express + Socket.IO 服务器入口
   - `socketEvents.ts`：Socket 事件注册
   - `roomManager.ts`：房间管理（创建/加入/离开）
   - `gameHandler.ts`：游戏动作处理和状态广播

5. **实现 client 包**：
   - `store/`：Zustand 状态管理
   - `services/socketService.ts`：Socket.IO 客户端封装
   - `pages/`：Lobby + GamePage
   - `components/`：游戏 UI 组件
   - `styles/`：CSS 样式

6. **注册到 Portal**：
   - 在 `portal/src/App.tsx` 的 `games` 数组中添加新游戏信息
   - 端口分配规则

7. **更新启动脚本**：
   - `run.sh` 和 `stop.sh` 会自动发现新游戏目录（无需手动修改）
   - 更新根 `README.md` 的游戏列表

---

### 目录结构规范

#### [NEW] [directory-structure.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/directory-structure.md)
详细的目录结构规范，包含：
- 每个子包的标准目录结构和文件清单
- 各目录/文件的职责说明
- 文件组织的最佳实践
- client 端的分层：`pages/` → `components/` → `store/` → `services/` → `styles/`
- server 端的分层：`server.ts` → `socketEvents.ts` → `roomManager.ts` → `gameHandler.ts`

---

### 游戏规则文档规范

#### [NEW] [rules-template.md](file:///Users/keleya/Desktop/code/Tabletopia/docs/rules-template.md)
游戏规则文档的标准模板，参考 `lost_cities/rules.md` 的格式：
- 基本信息（玩家人数、建议年龄）
- 游戏组件
- 游戏准备
- 游戏目标
- 回合流程
- 计分规则
- 变体规则（可选）

---

## Verification Plan

### Manual Verification
- 审阅所有文档内容的准确性和完整性
- 检查文档中引用的文件路径是否正确
- 验证代码示例是否与现有项目一致
- 确认新游戏接入指南的步骤是否可操作


---
生成时间: 2026/3/9 22:18:06
planId: 
plan_status: review