
# 修改 run.sh 和 stop.sh 默认行为为启动/停止所有项目

## 背景

当前 `run.sh` 和 `stop.sh` 不添加参数时进入交互式选择模式，需要添加 `--all` 参数才能启动/停止所有项目。用户希望改为不添加参数时默认启动/停止所有项目。

## Proposed Changes

### 启动脚本

#### [MODIFY] [run.sh](file:///Users/keleya/Desktop/code/Tabletopia/run.sh)
- 将 `--all` 模式的逻辑改为默认行为（无参数时执行）
- 交互式选择模式改为通过 `--select` 参数触发
- 条件判断从 `if [ "$1" = "--all" ]` 改为 `if [ "$1" = "--select" ]`，并交换两个分支的逻辑

---

### 停止脚本

#### [MODIFY] [stop.sh](file:///Users/keleya/Desktop/code/Tabletopia/stop.sh)
- 将 `--all` 模式的逻辑改为默认行为（无参数时执行）
- 交互式选择模式改为通过 `--select` 参数触发
- 条件判断从 `if [ "$1" = "--all" ]` 改为 `if [ "$1" = "--select" ]`，并交换两个分支的逻辑

---

### 文档更新

#### [MODIFY] [README.md](file:///Users/keleya/Desktop/code/Tabletopia/README.md)
- 更新"快速开始"部分的命令示例，反映新的默认行为
- `./run.sh` 直接启动所有项目，`./run.sh --select` 进入交互式选择
- `./stop.sh` 直接停止所有项目，`./stop.sh --select` 进入交互式选择

## Verification Plan

### Manual Verification
- 执行 `./run.sh` 确认默认启动所有项目
- 执行 `./stop.sh` 确认默认停止所有项目


---
生成时间: 2026/3/9 20:28:19
planId: 
plan_status: review