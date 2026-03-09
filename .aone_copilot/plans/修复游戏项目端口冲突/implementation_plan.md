
# 修复游戏项目端口冲突导致首页链接失效

## 背景

使用 `./run.sh --all` 启动所有项目时，各游戏的 client（Vite dev server）配置的端口被占用，Vite 默认行为是自动尝试下一个可用端口，导致实际运行端口与 portal 首页中硬编码的链接不一致。

从日志中可以看到：
- Azul client 配置 3000，实际运行在 3001
- Splendor Duel client 配置 3002，实际运行在 3003
- Lost Cities client 配置 3004，实际运行在 3005

根本原因是各项目的 server 端口（3001/3003/3005）在 client 启动前已被占用，而 Vite 的 `Port XXXX is in use, trying another one...` 机制使 client 跳到了 server 的端口号上，造成进一步混乱。

## Proposed Changes

### Vite Client 配置 - 添加 strictPort

为每个游戏的 client vite 配置添加 `strictPort: true`，防止端口被静默跳转。这样如果端口被占用会直接报错，便于排查问题。

#### [MODIFY] [vite.config.ts](file:///Users/keleya/Desktop/code/Tabletopia/azul/packages/client/vite.config.ts)
- 在 `server` 配置中添加 `strictPort: true`

#### [MODIFY] [vite.config.ts](file:///Users/keleya/Desktop/code/Tabletopia/splendor-duel/packages/client/vite.config.ts)
- 在 `server` 配置中添加 `strictPort: true`

#### [MODIFY] [vite.config.ts](file:///Users/keleya/Desktop/code/Tabletopia/lost_cities/packages/client/vite.config.ts)
- 在 `server` 配置中添加 `strictPort: true`

---

### 启动脚本 - 确保端口清理和启动顺序

#### [MODIFY] [run.sh](file:///Users/keleya/Desktop/code/Tabletopia/run.sh)
- 在 `--all` 模式启动前，先调用 `./stop.sh --all` 清理残留进程，确保所有端口可用
- 在每个项目启动后添加短暂延迟（`sleep 2`），确保 server 完全绑定端口后 client 再启动，避免竞态条件

> [!IMPORTANT]
> 端口冲突的直接原因是残留进程占用了端口。添加启动前清理步骤可以从根本上避免此问题。

---

### Server 端口配置验证

当前各 server 端口配置正确，无需修改：
- Azul server: 3001（`azul/packages/server/src/server.ts`）
- Splendor Duel server: 3003（`splendor-duel/packages/server/src/server.ts`）
- Lost Cities server: 3005（`lost_cities/packages/server/src/server.ts`）

Client 端口配置也正确：
- Azul client: 3000（proxy → 3001）
- Splendor Duel client: 3002（proxy → 3003）
- Lost Cities client: 3004（proxy → 3005）

Portal 首页链接也正确指向 client 端口（3000/3002/3004）。

## Verification Plan

### Manual Verification
1. 先执行 `./stop.sh --all` 停止所有进程
2. 执行 `./run.sh --all` 启动所有项目
3. 检查日志文件确认各 client 运行在正确端口（无 "Port XXXX is in use" 警告）
4. 访问 `http://localhost:4000`（portal 首页），点击各游戏链接验证能正常跳转


---
生成时间: 2026/3/9 20:19:11
planId: 
plan_status: review