# Azul Online - 花砖物语

多人在线对战桌游 - 花砖物语 (Azul)

## 游戏简介

从工厂展示区中挑选精美的瓷砖，装饰你的宫殿墙壁。策略性地选择和放置瓷砖，获得最高分数！

## 项目结构

本项目采用 npm workspaces monorepo 架构，分为四个包：

```
azul/
├── package.json              # 根级 monorepo 配置
├── tsconfig.base.json        # TypeScript 基础配置
├── packages/
│   ├── shared/               # 共享类型定义与常量
│   │   └── src/
│   │       ├── types.ts      # TileColor, GameState, PlayerBoard 等类型
│   │       ├── constants.ts  # 瓷砖数量、工厂规则、墙面映射等常量
│   │       └── index.ts
│   ├── game-logic/           # 游戏逻辑引擎（纯函数，无副作用）
│   │   └── src/
│   │       ├── __tests__/    # 单元测试
│   │       └── index.ts
│   ├── server/               # Socket.IO 服务端
│   │   └── src/
│   │       ├── server.ts     # 服务器入口（端口 3001）
│   │       ├── socketEvents.ts # Socket 事件注册
│   │       ├── roomManager.ts  # 房间管理
│   │       └── gameHandler.ts  # 游戏动作处理
│   └── client/               # React 客户端
│       ├── index.html
│       ├── vite.config.ts    # Vite 配置（端口 3000）
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── services/     # Socket.IO 通信服务
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

## 端口配置

| 服务 | 端口 |
|------|------|
| Client (Vite) | 3000 |
| Server (Socket.IO) | 3001 |

## 技术栈

- **TypeScript** - 全栈类型安全
- **React 18** - 客户端 UI
- **Zustand + Immer** - 状态管理
- **Vite** - 客户端构建工具
- **Socket.IO** - 实时通信
- **Express** - HTTP 服务
- **Vitest** - 单元测试
- **npm workspaces** - Monorepo 管理

## 游戏规则

- 2-4 人对战，5 种颜色瓷砖
- 每回合从工厂或中心区域选取同色瓷砖，放入模式线
- 回合结束时，完成的模式线将瓷砖移至墙面并计分
- 完成整行/整列/全色额外加分
- 游戏在某玩家完成墙面一整行后结束，最高分者获胜
