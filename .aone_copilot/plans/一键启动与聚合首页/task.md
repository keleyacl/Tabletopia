
# 一键启动与聚合首页 - 任务清单

## 端口规范化
- [x] 修改 `lost_cities/packages/client/vite.config.ts`，将端口从 5173 改为 3004，添加 WebSocket proxy 配置
- [x] 修改 `lost_cities/packages/server/src/server.ts`，将端口从 8080 改为 3005
- [x] 检查 lost_cities 客户端代码中是否有硬编码的 WebSocket 连接地址（如 ws://localhost:8080），需要同步更新

## 聚合首页 (portal)
- [x] 创建 `portal/package.json`
- [x] 创建 `portal/tsconfig.json`
- [x] 创建 `portal/vite.config.ts`（端口 4000）
- [x] 创建 `portal/index.html`
- [x] 创建 `portal/src/main.tsx`
- [x] 创建 `portal/src/App.tsx`（游戏卡片导航页）
- [x] 创建 `portal/src/App.css`（首页样式）
- [x] 执行 `npm install` 安装 portal 依赖

## 启动/停止脚本
- [x] 修改 `run.sh`，新增 `--all` 参数支持一键启动所有项目
- [x] 修改 `stop.sh`，新增 `--all` 参数支持一键停止所有项目

## 验证
- [ ] 手动验证：执行 `./run.sh --all` 启动所有项目
- [ ] 手动验证：访问 `http://localhost:4000` 检查聚合首页
- [ ] 手动验证：点击卡片跳转各游戏
- [ ] 手动验证：执行 `./stop.sh --all` 停止所有项目


---
生成时间: 2026/3/9 19:50:10
planId: 