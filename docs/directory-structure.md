# Tabletopia 目录结构规范

本文档定义了 Tabletopia 项目的标准目录结构和组织规范。

## 项目根目录结构

```
Tabletopia/
├── portal/                      # 聚合首页（游戏入口导航）
├── azul/                        # 花砖物语游戏项目
├── splendor-duel/               # 璀璨宝石·对决游戏项目
├── lost_cities/                 # 失落的城市游戏项目
├── docs/                        # 项目文档目录
├── run.sh                       # 一键启动所有项目的脚本
├── stop.sh                      # 一键停止所有项目的脚本
├── README.md                    # 项目说明文档
├── .gitignore                   # Git 忽略文件配置
└── .idea/                       # IDE 配置目录（本地开发）
```

### 各目录/文件职责说明

- **portal/** - 聚合首页，提供所有游戏的入口导航和游戏信息展示
- **azul/** - 花砖物语游戏项目的完整实现
- **splendor-duel/** - 璀璨宝石·对决游戏项目的完整实现
- **lost_cities/** - 失落的城市游戏项目的完整实现
- **docs/** - 项目文档目录，存放开发规范、接入指南等文档
- **run.sh** - 一键启动脚本，自动发现并启动所有游戏项目和 Portal
- **stop.sh** - 一键停止脚本，清理所有运行中的项目进程
- **README.md** - 项目说明文档，包含项目介绍、快速开始指南等
- **.gitignore** - Git 版本控制忽略文件配置
- **.idea/** - IDE（如 IntelliJ IDEA）的配置目录，不应提交到版本控制

## 游戏子项目标准结构

每个游戏项目都采用 npm workspaces monorepo 架构，包含四个核心子包：

```
<game>/
├── packages/
│   ├── shared/                  # 共享类型定义与常量
│   │   ├── src/
│   │   │   ├── index.ts         # 统一导出入口
│   │   │   ├── types.ts         # 核心类型定义
│   │   │   └── constants.ts     # 游戏常量配置
│   │   ├── package.json         # shared 包配置
│   │   └── tsconfig.json        # TypeScript 配置
│   │
│   ├── game-logic/              # 游戏逻辑引擎（纯函数）
│   │   ├── src/
│   │   │   ├── index.ts         # 统一导出入口
│   │   │   ├── gameInit.ts      # 游戏初始化逻辑
│   │   │   ├── gameActions.ts   # 游戏动作处理
│   │   │   ├── gameScoring.ts   # 游戏计分逻辑
│   │   │   ├── utils.ts         # 工具函数
│   │   │   └── __tests__/       # 测试文件目录
│   │   │       └── *.test.ts    # 单元测试文件
│   │   ├── package.json         # game-logic 包配置
│   │   ├── tsconfig.json        # TypeScript 配置
│   │   └── vitest.config.ts     # Vitest 测试配置
│   │
│   ├── server/                  # WebSocket 服务端
│   │   ├── src/
│   │   │   ├── server.ts        # 服务器入口
│   │   │   ├── socketEvents.ts  # Socket 事件处理
│   │   │   ├── roomManager.ts   # 房间管理逻辑
│   │   │   └── gameHandler.ts   # 游戏逻辑处理
│   │   ├── package.json         # server 包配置
│   │   └── tsconfig.json        # TypeScript 配置
│   │
│   └── client/                  # React 客户端
│       ├── src/
│       │   ├── main.tsx         # 应用入口
│       │   ├── App.tsx          # 根组件
│       │   ├── pages/           # 页面组件
│       │   │   ├── Lobby.tsx    # 大厅页面
│       │   │   └── GamePage.tsx # 游戏页面
│       │   ├── components/      # 可复用组件
│       │   │   ├── GameBoard.tsx
│       │   │   ├── PlayerHand.tsx
│       │   │   └── RulesModal.tsx
│       │   ├── store/           # 状态管理
│       │   │   ├── gameStore.ts # 游戏状态 Store
│       │   │   └── roomStore.ts # 房间状态 Store
│       │   ├── services/        # 服务层
│       │   │   └── socketService.ts # WebSocket 服务
│       │   └── styles/          # 样式文件
│       │       ├── global.css   # 全局样式
│       │       └── components.css # 组件样式
│       ├── index.html           # HTML 模板
│       ├── package.json         # client 包配置
│       ├── tsconfig.json        # TypeScript 配置
│       └── vite.config.ts       # Vite 构建配置
│
├── package.json                 # 根包配置（workspaces 定义）
├── tsconfig.base.json           # TypeScript 基础配置
├── README.md                    # 游戏说明文档
├── rules.md                     # 游戏规则文档
└── .gitignore                   # Git 忽略文件配置
```

### 各目录/文件职责说明

#### 根目录文件
- **package.json** - 定义 npm workspaces 和项目脚本
- **tsconfig.base.json** - TypeScript 基础配置，被所有子包继承
- **README.md** - 游戏项目的说明文档
- **rules.md** - 游戏规则文档，用于 RulesModal 组件展示

#### shared 包
- **index.ts** - 统一导出所有类型和常量，供其他包引用
- **types.ts** - 定义游戏核心类型（GameState、PlayerState、GameAction 等）
- **constants.ts** - 定义游戏常量（颜色、点数、配置等）

#### game-logic 包
- **index.ts** - 统一导出游戏逻辑函数
- **gameInit.ts** - 游戏初始化函数，生成初始游戏状态
- **gameActions.ts** - 游戏动作处理函数，处理玩家操作
- **gameScoring.ts** - 游戏计分函数，计算游戏得分
- **utils.ts** - 工具函数，辅助游戏逻辑实现
- **__tests__/** - 测试文件目录，存放所有单元测试

#### server 包
- **server.ts** - WebSocket 服务器入口，启动 HTTP 和 WebSocket 服务
- **socketEvents.ts** - 定义和处理所有 Socket.IO 事件
- **roomManager.ts** - 房间管理逻辑，处理房间创建、加入、离开等
- **gameHandler.ts** - 游戏逻辑处理，调用 game-logic 包处理游戏动作

#### client 包
- **main.tsx** - React 应用入口，挂载根组件
- **App.tsx** - 根组件，定义路由和布局
- **pages/** - 页面组件目录
- **components/** - 可复用组件目录
- **store/** - Zustand 状态管理 Store
- **services/** - 服务层，封装 WebSocket 等外部服务
- **styles/** - 样式文件目录
- **vite.config.ts** - Vite 构建和开发服务器配置

## Portal 项目结构

```
portal/
├── src/
│   ├── App.tsx                  # 主应用组件
│   └── main.tsx                 # 应用入口
├── index.html                   # HTML 模板
├── package.json                 # Portal 项目配置
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 配置
└── README.md                    # Portal 说明文档
```

### Portal 职责说明

- **src/App.tsx** - 主应用组件，包含游戏列表展示和导航
- **src/main.tsx** - React 应用入口，渲染 App 组件
- **index.html** - HTML 模板，定义应用根节点
- **package.json** - Portal 项目依赖和脚本配置
- **tsconfig.json** - TypeScript 编译配置
- **vite.config.ts** - Vite 开发服务器配置（端口 4000）

## 文件组织最佳实践

### 1. 统一导出

每个包通过 `index.ts` 统一导出所有公开 API，其他包通过此文件引用：

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './constants';

// 其他包引用
import { GameState, GameAction } from '@<game-name>/shared';
```

### 2. 测试文件组织

测试文件放在 `__tests__/` 目录下，使用 `.test.ts` 后缀：

```
packages/game-logic/src/
├── gameActions.ts
└── __tests__/
    └── gameActions.test.ts
```

### 3. 样式文件组织

样式文件集中在 `styles/` 目录下，按功能分类：

```
packages/client/src/styles/
├── global.css           # 全局样式
├── components.css       # 通用组件样式
├── pages.css            # 页面样式
└── themes.css           # 主题样式
```

### 4. 组件组织

页面组件和可复用组件分开放置：

```
packages/client/src/
├── pages/               # 页面组件（路由页面）
│   ├── Lobby.tsx
│   └── GamePage.tsx
└── components/          # 可复用组件
    ├── GameBoard.tsx
    ├── PlayerHand.tsx
    └── RulesModal.tsx
```

### 5. 命名规范

- 文件名：使用 PascalCase（如 `GameBoard.tsx`）
- 目录名：使用 camelCase 或 kebab-case（如 `components/`）
- 测试文件：使用 `.test.ts` 后缀（如 `gameActions.test.ts`）
- 样式文件：使用 `.css` 后缀（如 `global.css`）

## 端口分配规范

每个游戏项目占用两个端口：客户端端口和服务器端口。端口分配如下：

| 游戏 | Client 端口 | Server 端口 |
|------|------------|------------|
| Portal | 4000 | - |
| Azul | 3000 | 3001 |
| Splendor Duel | 3002 | 3003 |
| Lost Cities | 3004 | 3005 |
| 新游戏 | 3006 | 3007 |

新游戏接入时，请按照递增顺序分配端口。
