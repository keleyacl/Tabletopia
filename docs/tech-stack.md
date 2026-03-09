# 技术选型规范

## 核心技术栈总览

| 类别 | 技术 | 版本要求 | 说明 |
|------|------|----------|------|
| 语言 | TypeScript | ^5.3 | 全栈使用，启用 strict 模式 |
| 前端框架 | React | 18 | 函数式组件 + Hooks |
| 构建工具 | Vite | 5 | 构建工具和开发服务器 |
| 状态管理 | Zustand | ^4.5 | 配合 Immer ^10.0 使用 |
| 路由 | React Router DOM | ^6.21 | 客户端路由 |
| WebSocket 客户端 | Socket.IO Client | ^4.7 | 实时通信 |
| 拖拽 | React DnD | ^16.0 | 可选，用于拖拽功能 |
| 后端框架 | Express | ^4.18 | HTTP 服务器 |
| WebSocket 服务端 | Socket.IO | ^4.7 | 推荐，实时通信 |
| 原生 WebSocket | ws | - | 也可使用 |
| 测试 | Vitest | ^1.6 | 主要覆盖 game-logic 包 |
| 工具链 | npm workspaces | - | 包管理 |
| 工具链 | concurrently | ^8.2 | 并发执行 |
| 样式 | 纯 CSS / Tailwind | - | 推荐纯 CSS，可选 Tailwind |

## 语言

- **TypeScript**：全栈使用，启用 strict 模式
- **编译目标**：target: ES2020, module: ESNext
- **模块解析**：moduleResolution: bundler

## 前端技术栈

- **React 18**：使用函数式组件 + Hooks
- **Vite 5**：作为构建工具和开发服务器
- **Zustand ^4.5**：状态管理，配合 Immer ^10.0 进行不可变状态更新
- **React Router DOM ^6.21**：客户端路由
- **Socket.IO Client ^4.7**：WebSocket 客户端，用于实时通信
- **React DnD ^16.0**：可选，用于实现拖拽功能

## 后端技术栈

- **Express ^4.18**：HTTP 服务器
- **Socket.IO ^4.7**：WebSocket 服务端，推荐使用
- **ws**：也可使用原生 WebSocket
- **cors ^2.8**：跨域资源共享
- **uuid ^9.0 或 nanoid**：唯一标识符生成
- **tsx ^4.7**：TypeScript 执行器

## 测试

- **Vitest ^1.6**：主要覆盖 game-logic 包

## 工具链

- **npm workspaces**：包管理和依赖共享
- **concurrently ^8.2**：并发执行多个命令
- **TypeScript ^5.3**：类型检查和编译

## 样式方案

- **推荐**：纯 CSS
- **可选**：Tailwind CSS
- **不推荐**：混用多种样式方案

## 禁止/不推荐的技术

### 禁止使用
- CSS-in-JS（styled-components、emotion）

### 不推荐使用
- React class 组件
- Redux
- Webpack
- Jest

## 版本锁定建议

- 使用 `package-lock.json` 锁定依赖版本
- 主要依赖使用 `^` 范围版本号
- 确保团队成员依赖版本一致性
