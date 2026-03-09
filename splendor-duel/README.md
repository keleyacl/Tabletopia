# Splendor Duel Online - 璀璨宝石·对决

双人在线对战桌游 - 璀璨宝石·对决 (Splendor Duel)

## 游戏简介

在宝石市场中与对手展开激烈角逐，收集宝石、购买发展卡、赢得贵族青睐，成为最富有的珠宝商！

## 项目结构

本项目采用 npm workspaces monorepo 架构，分为四个包：

```
splendor-duel/
├── package.json              # 根级 monorepo 配置
├── tsconfig.base.json        # TypeScript 基础配置
├── packages/
│   ├── shared/               # 共享类型定义与常量
│   │   └── src/
│   │       ├── types.ts      # 游戏类型定义
│   │       ├── constants.ts  # 游戏常量
│   │       └── index.ts
│   ├── game-logic/           # 游戏逻辑引擎（纯函数，无副作用）
│   │   └── src/
│   │       ├── __tests__/    # 单元测试
│   │       └── index.ts
│   ├── server/               # Socket.IO 服务端
│   │   └── src/
│   │       ├── server.ts     # 服务器入口（端口 3003）
│   │       ├── socketEvents.ts # Socket 事件处理
│   │       └── ...
│   └── client/               # React 客户端
│       ├── index.html
│       ├── vite.config.ts    # Vite 配置（端口 3002）
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
| Client (Vite) | 3002 |
| Server (Socket.IO) | 3003 |

## 技术栈

- **TypeScript** - 全栈类型安全
- **React 18** - 客户端 UI
- **Zustand + Immer** - 状态管理
- **Vite** - 客户端构建工具
- **Tailwind CSS** - 样式框架
- **Socket.IO** - 实时通信
- **Express** - HTTP 服务
- **Vitest** - 单元测试
- **npm workspaces** - Monorepo 管理

## 游戏规则

- 双人对战
- 从宝石棋盘上拿取宝石，购买发展卡积累声望
- 三种胜利条件：积累足够声望点数、收集同色声望、收集皇冠
- 策略性地选择宝石和卡牌，阻止对手达成胜利条件
