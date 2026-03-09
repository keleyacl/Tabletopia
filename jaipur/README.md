# 斋浦尔 (Jaipur)

经典双人对战桌游《斋浦尔》的在线版实现。

## 游戏简介

在印度拉贾斯坦邦的首府斋浦尔，两位商人展开激烈的贸易角逐。通过收集和出售货物（钻石、黄金、白银、布料、香料、皮革）来获取利润，同时利用骆驼作为交换的筹码。率先积累最多财富的商人将赢得大君的青睐！

## 技术架构

采用 Monorepo 架构，包含以下子包：

- `packages/shared` - 共享类型定义与游戏常量
- `packages/game-logic` - 纯函数式游戏引擎（可独立测试）
- `packages/server` - Socket.IO 服务端（端口 3007）
- `packages/client` - React 客户端（端口 3006）

## 技术栈

- **语言**: TypeScript 5.3
- **构建**: Vite 5
- **前端**: React 18
- **状态管理**: Zustand + Immer
- **样式**: Tailwind CSS 4.0
- **通信**: Socket.IO
- **测试**: Vitest

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（同时启动客户端和服务端）
npm run dev

# 仅启动客户端
npm run dev:client

# 仅启动服务端
npm run dev:server

# 运行测试
npm test

# 构建
npm run build
```

## 访问地址

- 客户端: http://localhost:3006
- 服务端: http://localhost:3007
