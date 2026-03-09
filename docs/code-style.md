# 代码规范

## 文件命名规范

### TypeScript 源文件
- 使用 camelCase.ts 命名
- 示例：`gameInit.ts`, `playerManager.ts`

### React 组件
- 使用 PascalCase.tsx 命名
- 示例：`PlayerBoard.tsx`, `GameCard.tsx`

### 测试文件
- 格式：`<source>.test.ts`
- 示例：`gameLogic.test.ts`, `playerManager.test.ts`

### 样式文件
- 使用 camelCase.css 命名
- 示例：`playerBoard.css`, `gameCard.css`

### 包名
- 使用 kebab-case，格式为 `@<game-name>/<package>`
- 示例：`@lost-cities/shared`, `@splendor-duel/client`

## 类型命名规范

### 接口/类型
- 使用 PascalCase
- 示例：`GameState`, `PlayerData`, `GameAction`

### 枚举
- 使用 PascalCase
- 示例：`TileColor`, `PlayerState`, `GamePhase`

## 函数命名规范

### 普通函数
- 使用动词开头的 camelCase
- 示例：`createRoom`, `joinGame`, `validateMove`

### 布尔返回值函数
- 使用 `is`、`has`、`can` 前缀
- 示例：`isValidMove`, `hasPlayerWon`, `canMakeAction`

### 事件处理函数
- 使用 `handle` 前缀
- 示例：`handleCardClick`, `handlePlayerJoin`, `handleGameStart`

## 变量命名规范

### 普通变量
- 使用 camelCase
- 示例：`playerName`, `gameState`, `currentTurn`

### 常量
- 使用 UPPER_SNAKE_CASE
- 示例：`MAX_PLAYERS`, `DEFAULT_TIMEOUT`, `GAME_CONFIG`

### 布尔变量
- 使用 `is`、`has`、`can`、`should` 前缀
- 示例：`isGameActive`, `hasPlayerMoved`, `canStartGame`, `shouldEndTurn`

### 数组
- 使用复数形式
- 示例：`players`, `cards`, `availableMoves`

## Socket 事件命名规范

### 命名格式
- 格式：`namespace:action`

### 客户端 → 服务端
- 使用动词原形
- 示例：`room:create`, `game:action`, `player:join`

### 服务端 → 客户端
- 使用过去式
- 示例：`room:created`, `game:stateUpdated`, `player:joined`

## 代码组织原则

### shared 包
- 只包含类型定义和常量
- 不包含任何业务逻辑或副作用
- 示例：`@<game-name>/shared`

### game-logic 包
- 使用纯函数实现
- 无副作用
- 独立于 UI 和网络层
- 示例：`@<game-name>/game-logic`

### server 包
- 推荐组织结构：
  - `server.ts` → 主入口
  - `socketEvents.ts` → Socket 事件处理
  - `roomManager.ts` → 房间管理
  - `gameHandler.ts` → 游戏逻辑处理
- 示例：`@<game-name>/server`

### client 包
- 推荐目录结构：
  - `store/` → Zustand 状态管理
  - `services/` → Socket 和 API 服务
  - `pages/` → 页面组件
  - `components/` → 可复用组件
  - `styles/` → 样式文件
- 示例：`@<game-name>/client`

## TypeScript 使用规范

### 类型定义
- 优先使用 `type` 而非 `interface`
- 示例：
  ```typescript
  type GameState = {
    players: Player[];
    currentTurn: number;
    phase: GamePhase;
  };
  ```

### 类型安全
- 避免使用 `any`，使用 `unknown` 替代
- 示例：
  ```typescript
  // 避免
  function processData(data: any) { ... }
  
  // 推荐
  function processData(data: unknown) {
    if (isPlayerData(data)) { ... }
  }
  ```

### 函数类型注解
- 函数参数和返回值必须有类型注解
- 示例：
  ```typescript
  function createRoom(config: RoomConfig): Room {
    // 实现
  }
  ```

## React 组件规范

### 组件定义
- 使用函数式组件 + Hooks
- 示例：
  ```typescript
  function PlayerBoard({ player, onCardClick }: PlayerBoardProps) {
    // 实现
  }
  ```

### 状态管理
- 使用 Zustand hooks 管理状态
- 示例：
  ```typescript
  const gameState = useGameStore(state => state.gameState);
  const updateGameState = useGameStore(state => state.updateGameState);
  ```

### Socket 通信
- 避免在组件中直接操作 Socket
- 通过服务层封装 Socket 操作
- 示例：
  ```typescript
  // 不推荐
  useEffect(() => {
    socket.emit('game:action', action);
  }, [action]);
  
  // 推荐
  const gameService = useGameService();
  const handleAction = () => {
    gameService.sendAction(action);
  };
  ```

## 导入顺序

按照以下顺序组织导入：

1. 第三方库
2. 内部包（@<game-name>/*）
3. 本地模块（相对路径）
4. 样式文件

示例：
```typescript
// 第三方库
import React from 'react';
import { useStore } from 'zustand';

// 内部包
import { GameState } from '@lost-cities/shared';
import { useGameStore } from '@lost-cities/client';

// 本地模块
import { PlayerCard } from './components/PlayerCard';
import { validateMove } from './utils/gameLogic';

// 样式文件
import './styles/PlayerBoard.css';
```
