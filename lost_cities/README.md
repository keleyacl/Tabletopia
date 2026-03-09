# Lost Cities Online

双人在线对战桌游 - 失落的城市 (Lost Cities)

## 项目结构

本项目采用 npm workspaces monorepo 架构，分为四个包：

```
lost_cities/
├── package.json              # 根级 monorepo 配置
├── tsconfig.base.json        # TypeScript 基础配置
├── packages/
│   ├── shared/               # 共享类型定义与常量
│   │   └── src/
│   │       ├── types.ts      # Card, GameState, PlayerView 等类型
│   │       ├── constants.ts  # COLORS, NUMBERS, 规则数据等常量
│   │       └── index.ts
│   ├── game-logic/           # 游戏逻辑引擎（纯函数，无副作用）
│   │   └── src/
│   │       ├── gameInit.ts   # 洗牌、发牌、创建初始状态
│   │       ├── gameActions.ts # 出牌、抽牌、继续下一局
│   │       ├── gameScoring.ts # 计分逻辑
│   │       ├── utils.ts      # 深拷贝、获取弃牌堆顶牌
│   │       ├── __tests__/    # 单元测试
│   │       └── index.ts
│   ├── server/               # WebSocket 服务端
│   │   └── src/
│   │       ├── server.ts     # 服务器入口
│   │       ├── socketEvents.ts # 消息处理
│   │       ├── roomManager.ts  # 房间管理
│   │       └── gameHandler.ts  # 游戏动作处理
│   └── client/               # React 客户端
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── services/     # WebSocket 通信服务
│           ├── store/        # Zustand 状态管理
│           ├── pages/        # 页面组件
│           ├── components/   # UI 组件
│           └── styles/       # CSS 样式
```

## 快速开始

```bash
# 安装依赖
npm install

# 同时启动服务端和客户端
npm run dev

# 仅启动服务端
npm run dev:server

# 仅启动客户端
npm run dev:client
```

## 构建

```bash
npm run build
```

## 测试

```bash
npm run test
```

## 技术栈

- **TypeScript** - 全栈类型安全
- **React 18** - 客户端 UI
- **Zustand + Immer** - 状态管理
- **Vite** - 客户端构建工具
- **原生 WebSocket (ws)** - 实时通信
- **Vitest** - 单元测试
- **npm workspaces** - Monorepo 管理

## 游戏规则

- 双人对战，五种颜色探险路线
- 每回合先出牌（打入探险列或弃牌），再抽牌（牌堆或弃牌堆）
- 探险列必须按点数严格递增，投资牌须在点数牌之前
- 计分：(点数和 - 20) × (1 + 投资牌数)，8张及以上额外 +20
- 牌堆抽空时本局结束，多局累计决定胜负

详细规则参见 [rules.md](./rules.md)。
