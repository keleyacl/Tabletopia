# Tabletopia - 桌游合集

在线多人对战桌游平台，包含多款经典桌游的数字化实现。

## 游戏列表

| 游戏 | 说明 | 玩家数 | Client 端口 | Server 端口 |
|------|------|--------|------------|------------|
| 🏛️ [花砖物语 (Azul)](./azul/) | 瓷砖拼贴策略游戏 | 2-4 人 | 3000 | 3001 |
| 💎 [璀璨宝石·对决 (Splendor Duel)](./splendor-duel/) | 宝石收集对战游戏 | 2 人 | 3002 | 3003 |
| 🏔️ [失落的城市 (Lost Cities)](./lost_cities/) | 探险卡牌对战游戏 | 2 人 | 3004 | 3005 |

聚合首页 (Portal) 运行在端口 **4000**，提供所有游戏的入口导航。

## 项目结构

```
Tabletopia/
├── portal/              # 聚合首页（游戏入口导航）
├── azul/                # 花砖物语
├── splendor-duel/       # 璀璨宝石·对决
├── lost_cities/         # 失落的城市
├── run.sh               # 启动脚本
├── stop.sh              # 停止脚本
└── README.md
```

每个游戏项目均采用 **npm workspaces monorepo** 架构：

```
<game>/
├── packages/
│   ├── shared/          # 共享类型定义与常量
│   ├── game-logic/      # 游戏逻辑引擎（纯函数）
│   ├── server/          # WebSocket 服务端
│   └── client/          # React 客户端
├── package.json
└── tsconfig.base.json
```

## 快速开始

### 一键启动所有项目

```bash
# 启动所有游戏 + 聚合首页
./run.sh --all

# 停止所有项目
./stop.sh --all
```

启动后访问：
- **聚合首页**: http://localhost:4000
- **Azul**: http://localhost:3000
- **Splendor Duel**: http://localhost:3002
- **Lost Cities**: http://localhost:3004

### 启动单个项目

```bash
# 交互式选择
./run.sh

# 或进入项目目录手动启动
cd azul
npm install
npm run dev
```

## 技术栈

- **TypeScript** - 全栈类型安全
- **React 18** - 客户端 UI
- **Zustand + Immer** - 状态管理
- **Vite** - 客户端构建工具
- **Socket.IO / WebSocket** - 实时通信
- **Vitest** - 单元测试
- **npm workspaces** - Monorepo 管理
