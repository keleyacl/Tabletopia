
# 一键启动所有游戏项目并创建聚合首页

提供一键启动/停止所有游戏项目的脚本，并创建一个轻量级的聚合首页，作为所有游戏的入口导航。

## 端口分配（无冲突）

| 项目 | Client 端口 | Server 端口 | 协议 |
|------|------------|------------|------|
| **聚合首页 (portal)** | **4000** | - | HTTP |
| azul | 3000 | 3001 | Socket.IO |
| splendor-duel | 3002 | 3003 | Socket.IO |
| lost_cities | 5173 | 8080 | WebSocket |

> [!NOTE]
> 所有端口均无冲突，可以安全地同时启动。聚合首页使用端口 4000。

## Proposed Changes

### 启动脚本

#### [MODIFY] [run.sh](file:///Users/keleya/Desktop/code/Multy/run.sh)
改造现有的 `run.sh`，新增 `--all` 参数支持一键启动所有游戏项目和聚合首页。保留原有的交互式单项目启动功能。

- 当执行 `./run.sh --all` 时，后台启动所有游戏项目（azul、splendor-duel、lost_cities）和聚合首页（portal）
- 每个项目使用 `npm run dev` 以后台方式启动
- 启动后输出所有项目的访问地址

#### [MODIFY] [stop.sh](file:///Users/keleya/Desktop/code/Multy/stop.sh)
改造现有的 `stop.sh`，新增 `--all` 参数支持一键停止所有项目。保留原有的交互式单项目停止功能。

---

### 聚合首页 (portal)

创建一个轻量级的 Vite + React 项目作为聚合首页，运行在端口 4000。

#### [NEW] [package.json](file:///Users/keleya/Desktop/code/Multy/portal/package.json)
聚合首页项目配置，依赖 vite + react。

#### [NEW] [tsconfig.json](file:///Users/keleya/Desktop/code/Multy/portal/tsconfig.json)
TypeScript 配置。

#### [NEW] [vite.config.ts](file:///Users/keleya/Desktop/code/Multy/portal/vite.config.ts)
Vite 配置，端口设为 4000。

#### [NEW] [index.html](file:///Users/keleya/Desktop/code/Multy/portal/index.html)
HTML 入口文件。

#### [NEW] [src/main.tsx](file:///Users/keleya/Desktop/code/Multy/portal/src/main.tsx)
React 入口文件。

#### [NEW] [src/App.tsx](file:///Users/keleya/Desktop/code/Multy/portal/src/App.tsx)
聚合首页主组件，展示三个游戏的卡片入口：
- **花砖物语 (Azul)** → `http://localhost:3000`
- **璀璨宝石·对决 (Splendor Duel)** → `http://localhost:3002`
- **失落的城市 (Lost Cities)** → `http://localhost:5173`

每个卡片包含游戏名称、简介、图标，点击后在新标签页打开对应游戏。

#### [NEW] [src/App.css](file:///Users/keleya/Desktop/code/Multy/portal/src/App.css)
聚合首页样式，采用卡片式布局，美观大方。

---

### lost_cities 端口规范化与 proxy 配置

#### [MODIFY] [vite.config.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/client/vite.config.ts)
将 lost_cities 的 client 端口从 5173 改为 **3004**，并添加 WebSocket proxy 配置，使端口分配更加规范统一：
- Client: 3004
- Server: 3005（对应修改 server.ts）

#### [MODIFY] [server.ts](file:///Users/keleya/Desktop/code/Multy/lost_cities/packages/server/src/server.ts)
将 lost_cities 的 server 端口从 8080 改为 **3005**，与其他项目保持一致的端口命名规范。

> [!IMPORTANT]
> lost_cities 端口规范化后的最终端口分配：
>
> | 项目 | Client 端口 | Server 端口 |
> |------|------------|------------|
> | portal (聚合首页) | 4000 | - |
> | azul | 3000 | 3001 |
> | splendor-duel | 3002 | 3003 |
> | lost_cities | 3004 | 3005 |

## Verification Plan

### Manual Verification
- 执行 `./run.sh --all` 验证所有项目是否成功启动
- 访问 `http://localhost:4000` 验证聚合首页是否正常显示
- 点击每个游戏卡片，验证是否能正确跳转到对应游戏
- 执行 `./stop.sh --all` 验证所有项目是否成功停止


---
生成时间: 2026/3/9 19:50:10
planId: 
plan_status: review