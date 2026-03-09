
# 修复游戏项目端口冲突 - 任务清单

## 配置修改

- [x] 修改 `azul/packages/client/vite.config.ts`：添加 `strictPort: true`
- [x] 修改 `splendor-duel/packages/client/vite.config.ts`：添加 `strictPort: true`
- [x] 修改 `lost_cities/packages/client/vite.config.ts`：添加 `strictPort: true`

## 启动脚本优化

- [x] 修改 `run.sh`：在 `--all` 模式启动前添加端口清理逻辑（调用 `./stop.sh --all`）
- [x] 修改 `run.sh`：在每个项目启动后添加 `sleep 2` 延迟

## 验证

- [x] 执行 `./stop.sh --all` 停止所有残留进程
- [x] 执行 `./run.sh --all` 启动所有项目
- [x] 检查日志确认各 client 运行在正确端口
- [ ] 访问 portal 首页验证各游戏链接可正常跳转（需用户手动验证）


---
生成时间: 2026/3/9 20:19:11
planId: 