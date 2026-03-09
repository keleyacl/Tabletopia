# 新游戏接入指南

本文档详细说明如何将新游戏接入 Tabletopia 平台。

## 概述

新游戏接入的整体流程如下：

1. 创建项目骨架（目录结构、配置文件）
2. 实现 shared 包（类型定义和常量）
3. 实现 game-logic 包（游戏逻辑引擎）
4. 实现 server 包（WebSocket 服务端）
5. 实现 client 包（React 客户端）
6. 注册到 Portal（添加游戏信息）
7. 验证和测试

整个流程遵循现有的项目架构和代码规范，确保新游戏与现有游戏保持一致的开发体验。

---

## 第一步：创建项目骨架

### 1.1 创建目录结构

在 Tabletopia 根目录下创建游戏项目目录：

```bash
# 进入项目根目录
cd /path/to/Tabletopia

# 创建游戏项目目录（以 "my-game" 为例）
mkdir my-game
cd my-game

# 创建 packages 目录和子包
mkdir -p packages/shared/src
mkdir -p packages/game-logic/src/__tests__
mkdir -p packages/server/src
mkdir -p packages/client/src/{pages,components,store,services,styles}
```

### 1.2 创建根 package.json

在 `my-game/package.json` 中创建以下内容：

```json
{
  "name": "my-game",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/shared",
    "packages/game-logic",
    "packages/server",
    "packages/client"
  ],
  "scripts": {
    "dev:server": "npm run dev -w packages/server",
    "dev:client": "npm run dev -w packages/client",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build": "npm run build -w packages/shared && npm run build -w packages/game-logic && npm run build -w packages/server && npm run build -w packages/client",
    "test": "npm run test -w packages/game-logic"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

### 1.3 创建 tsconfig.base.json

在 `my-game/tsconfig.base.json` 中创建以下内容：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 1.4 创建 .gitignore

在 `my-game/.gitignore` 中创建以下内容：

```
node_modules
dist
*.log
.DS_Store
```

---

## 第二步：实现 shared 包

### 2.1 创建 shared/package.json

在 `packages/shared/package.json` 中创建以下内容：

```json
{
  "name": "@my-game/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2.2 创建 shared/src/types.ts

定义游戏核心类型：

```typescript
// 游戏状态
export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  phase: GamePhase;
  deck: any[];
  discardPiles: any[];
  // 根据游戏需要添加其他字段
}

// 玩家状态
export interface PlayerState {
  id: string;
  name: string;
  hand: any[];
  score: number;
  // 根据游戏需要添加其他字段
}

// 游戏动作
export interface GameAction {
  type: string;
  playerId: string;
  payload: any;
}

// 游戏阶段
export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  SCORING = 'scoring',
  ENDED = 'ended'
}

// 房间信息
export interface RoomInfo {
  id: string;
  players: PlayerState[];
  gameState: GameState | null;
  maxPlayers: number;
}

// Socket 事件类型
export interface SocketEvents {
  // 客户端发送的事件
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  makeMove: (action: GameAction) => void;
  
  // 服务器发送的事件
  roomJoined: (room: RoomInfo) => void;
  playerJoined: (player: PlayerState) => void;
  playerLeft: (playerId: string) => void;
  gameStateUpdated: (gameState: GameState) => void;
  gameStarted: () => void;
  gameEnded: (results: any) => void;
  error: (message: string) => void;
}
```

### 2.3 创建 shared/src/constants.ts

定义游戏常量：

```typescript
// 游戏配置
export const GAME_CONFIG = {
  MAX_PLAYERS: 2,
  MIN_PLAYERS: 2,
  INITIAL_HAND_SIZE: 8,
  // 根据游戏需要添加其他配置
};

// 颜色常量
export const COLORS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  PURPLE: 'purple',
} as const;

// 点数常量
export const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// 动作类型
export const ACTION_TYPES = {
  PLAY_CARD: 'PLAY_CARD',
  DISCARD_CARD: 'DISCARD_CARD',
  DRAW_CARD: 'DRAW_CARD',
  // 根据游戏需要添加其他动作类型
} as const;
```

### 2.4 创建 shared/src/index.ts

统一导出所有内容：

```typescript
export * from './types';
export * from './constants';
```

### 2.5 创建 shared/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

---

## 第三步：实现 game-logic 包

### 3.1 创建 game-logic/package.json

在 `packages/game-logic/package.json` 中创建以下内容：

```json
{
  "name": "@my-game/game-logic",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@my-game/shared": "*"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

### 3.2 创建 game-logic/src/gameInit.ts

实现游戏初始化逻辑：

```typescript
import { GameState, PlayerState, GAME_CONFIG } from '@my-game/shared';

export function initializeGame(playerNames: string[]): GameState {
  const players: PlayerState[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    hand: [],
    score: 0,
  }));

  // 初始化牌堆
  const deck = initializeDeck();

  // 发牌
  players.forEach(player => {
    player.hand = dealCards(deck, GAME_CONFIG.INITIAL_HAND_SIZE);
  });

  return {
    players,
    currentPlayerIndex: 0,
    phase: 'playing',
    deck,
    discardPiles: [],
  };
}

function initializeDeck(): any[] {
  // 根据游戏规则初始化牌堆
  return [];
}

function dealCards(deck: any[], count: number): any[] {
  return deck.splice(0, count);
}
```

### 3.3 创建 game-logic/src/gameActions.ts

实现游戏动作处理：

```typescript
import { GameState, GameAction, ACTION_TYPES } from '@my-game/shared';

export function applyAction(state: GameState, action: GameAction): GameState {
  const newState = JSON.parse(JSON.stringify(state)); // 深拷贝
  
  switch (action.type) {
    case ACTION_TYPES.PLAY_CARD:
      return handlePlayCard(newState, action);
    case ACTION_TYPES.DISCARD_CARD:
      return handleDiscardCard(newState, action);
    case ACTION_TYPES.DRAW_CARD:
      return handleDrawCard(newState, action);
    default:
      return newState;
  }
}

function handlePlayCard(state: GameState, action: GameAction): GameState {
  // 实现出牌逻辑
  return state;
}

function handleDiscardCard(state: GameState, action: GameAction): GameState {
  // 实现弃牌逻辑
  return state;
}

function handleDrawCard(state: GameState, action: GameAction): GameState {
  // 实现抽牌逻辑
  return state;
}
```

### 3.4 创建 game-logic/src/gameScoring.ts

实现游戏计分逻辑：

```typescript
import { GameState, PlayerState } from '@my-game/shared';

export function calculateScores(state: GameState): Record<string, number> {
  const scores: Record<string, number> = {};
  
  state.players.forEach(player => {
    scores[player.id] = calculatePlayerScore(player, state);
  });
  
  return scores;
}

function calculatePlayerScore(player: PlayerState, state: GameState): number {
  // 实现计分逻辑
  return 0;
}

export function getWinner(state: GameState): PlayerState | null {
  const scores = calculateScores(state);
  let maxScore = -Infinity;
  let winner: PlayerState | null = null;
  
  state.players.forEach(player => {
    const score = scores[player.id];
    if (score > maxScore) {
      maxScore = score;
      winner = player;
    }
  });
  
  return winner;
}
```

### 3.5 创建 game-logic/src/utils.ts

实现工具函数：

```typescript
import { GameState } from '@my-game/shared';

export function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

export function isGameOver(state: GameState): boolean {
  // 实现游戏结束判断逻辑
  return false;
}

export function validateAction(state: GameState, action: any): boolean {
  // 实现动作验证逻辑
  return true;
}
```

### 3.6 创建 game-logic/src/index.ts

统一导出所有函数：

```typescript
export * from './gameInit';
export * from './gameActions';
export * from './gameScoring';
export * from './utils';
```

### 3.7 创建 game-logic/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

### 3.8 纯函数原则说明

**重要**：game-logic 包中的所有函数必须是纯函数：

1. **无副作用**：函数不修改外部状态，只返回新的状态
2. **确定性**：相同输入总是产生相同输出
3. **可测试性**：纯函数易于单元测试
4. **不可变性**：使用深拷贝创建新状态，不修改原状态

示例：

```typescript
// ❌ 错误：修改原状态
function badAction(state: GameState): GameState {
  state.players[0].score += 10;
  return state;
}

// ✅ 正确：返回新状态
function goodAction(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state));
  newState.players[0].score += 10;
  return newState;
}
```

### 3.9 测试指南

在 `packages/game-logic/src/__tests__/` 目录下创建测试文件：

```typescript
// __tests__/gameActions.test.ts
import { describe, it, expect } from 'vitest';
import { initializeGame, applyAction } from '../gameActions';

describe('Game Actions', () => {
  it('should play a card correctly', () => {
    const state = initializeGame(['Alice', 'Bob']);
    const action = {
      type: 'PLAY_CARD',
      playerId: 'player-0',
      payload: { cardIndex: 0 },
    };
    
    const newState = applyAction(state, action);
    expect(newState).toBeDefined();
    // 添加更多断言
  });
});
```

运行测试：

```bash
npm run test
```

---

## 第四步：实现 server 包

### 4.1 创建 server/package.json

在 `packages/server/package.json` 中创建以下内容：

```json
{
  "name": "@my-game/server",
  "version": "1.0.0",
  "private": true,
  "main": "./src/server.ts",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@my-game/shared": "*",
    "@my-game/game-logic": "*",
    "ws": "^8.16.0",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "@types/ws": "^8.5.10",
    "tsx": "^4.7.0"
  }
}
```

### 4.2 创建 server/src/server.ts

实现 WebSocket 服务器：

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import { handleSocketConnection } from './socketEvents';
import { RoomManager } from './roomManager';

const PORT = 3007; // 根据端口分配规范设置
const wss = new WebSocketServer({ port: PORT });

const roomManager = new RoomManager();

console.log(`🚀 Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  const clientId = nanoid();
  console.log(`✅ Client connected: ${clientId}`);
  
  handleSocketConnection(ws, clientId, roomManager);
  
  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    roomManager.handleDisconnect(clientId);
  });
});
```

### 4.3 创建 server/src/socketEvents.ts

实现 Socket 事件处理：

```typescript
import { WebSocket } from 'ws';
import { RoomManager } from './roomManager';
import { GameHandler } from './gameHandler';
import { SocketEvents, GameAction } from '@my-game/shared';

export function handleSocketConnection(
  ws: WebSocket,
  clientId: string,
  roomManager: RoomManager
) {
  const gameHandler = new GameHandler(roomManager);

  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'joinRoom':
          gameHandler.handleJoinRoom(ws, clientId, message.roomId, message.playerName);
          break;
        case 'leaveRoom':
          gameHandler.handleLeaveRoom(ws, clientId);
          break;
        case 'makeMove':
          gameHandler.handleMakeMove(ws, clientId, message.action as GameAction);
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown event type' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
}
```

### 4.4 创建 server/src/roomManager.ts

实现房间管理逻辑：

```typescript
import { RoomInfo, PlayerState } from '@my-game/shared';

export class RoomManager {
  private rooms: Map<string, RoomInfo> = new Map();
  private clientToRoom: Map<string, string> = new Map();

  createRoom(): RoomInfo {
    const roomId = `room-${Date.now()}`;
    const room: RoomInfo = {
      id: roomId,
      players: [],
      gameState: null,
      maxPlayers: 2,
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }

  addPlayerToRoom(roomId: string, player: PlayerState): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return false;
    }
    room.players.push(player);
    return true;
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  handleDisconnect(clientId: string): void {
    const roomId = this.clientToRoom.get(clientId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.id === clientId);
        if (player) {
          this.removePlayerFromRoom(roomId, clientId);
        }
      }
      this.clientToRoom.delete(clientId);
    }
  }
}
```

### 4.5 创建 server/src/gameHandler.ts

实现游戏逻辑处理：

```typescript
import { WebSocket } from 'ws';
import { RoomManager } from './roomManager';
import { initializeGame, applyAction, calculateScores } from '@my-game/game-logic';
import { GameAction, GameState } from '@my-game/shared';

export class GameHandler {
  constructor(private roomManager: RoomManager) {}

  handleJoinRoom(
    ws: WebSocket,
    clientId: string,
    roomId: string,
    playerName: string
  ): void {
    let room = this.roomManager.getRoom(roomId);
    
    if (!room) {
      room = this.roomManager.createRoom();
    }

    const player: PlayerState = {
      id: clientId,
      name: playerName,
      hand: [],
      score: 0,
    };

    const success = this.roomManager.addPlayerToRoom(room.id, player);
    
    if (!success) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
      return;
    }

    ws.send(JSON.stringify({ type: 'roomJoined', room }));

    // 如果房间满了，开始游戏
    if (room.players.length === room.maxPlayers) {
      this.startGame(room);
    }
  }

  handleLeaveRoom(ws: WebSocket, clientId: string): void {
    // 实现离开房间逻辑
  }

  handleMakeMove(ws: WebSocket, clientId: string, action: GameAction): void {
    const room = this.roomManager.getRoom(action.payload.roomId);
    if (!room || !room.gameState) {
      ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
      return;
    }

    const newState = applyAction(room.gameState, action);
    room.gameState = newState;

    // 广播新状态给所有玩家
    this.broadcastGameState(room);
  }

  private startGame(room: RoomInfo): void {
    const playerNames = room.players.map(p => p.name);
    room.gameState = initializeGame(playerNames);
    
    this.broadcastGameState(room);
    this.broadcastEvent(room, { type: 'gameStarted' });
  }

  private broadcastGameState(room: RoomInfo): void {
    this.broadcastEvent(room, {
      type: 'gameStateUpdated',
      gameState: room.gameState,
    });
  }

  private broadcastEvent(room: RoomInfo, event: any): void {
    // 实现广播逻辑（需要维护 WebSocket 连接映射）
  }
}
```

### 4.6 创建 server/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 第五步：实现 client 包

### 5.1 创建 client/package.json

在 `packages/client/package.json` 中创建以下内容：

```json
{
  "name": "@my-game/client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@my-game/shared": "*",
    "@my-game/game-logic": "*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.0",
    "immer": "^10.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}
```

### 5.2 创建 client/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006, // 根据端口分配规范设置
    strictPort: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3007',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
```

### 5.3 创建 client/src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 5.4 创建 client/src/App.tsx

```typescript
import { useState } from 'react';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';
import { GameState } from '@my-game/shared';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const handleGameStart = (state: GameState, pid: string) => {
    setGameState(state);
    setPlayerId(pid);
  };

  return (
    <div className="app">
      {!gameState ? (
        <Lobby onGameStart={handleGameStart} />
      ) : (
        <GamePage gameState={gameState} playerId={playerId!} />
      )}
    </div>
  );
}

export default App;
```

### 5.5 创建 client/src/store/gameStore.ts

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState } from '@my-game/shared';

interface GameStore {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateGameState: (updater: (state: GameState) => void) => void;
}

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    gameState: null,
    setGameState: (state) => set({ gameState: state }),
    updateGameState: (updater) =>
      set((state) => {
        if (state.gameState) {
          updater(state.gameState);
        }
      }),
  }))
);
```

### 5.6 创建 client/src/store/roomStore.ts

```typescript
import { create } from 'zustand';
import { RoomInfo } from '@my-game/shared';

interface RoomStore {
  roomId: string | null;
  playerName: string | null;
  room: RoomInfo | null;
  setRoomId: (roomId: string) => void;
  setPlayerName: (name: string) => void;
  setRoom: (room: RoomInfo) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  playerName: null,
  room: null,
  setRoomId: (roomId) => set({ roomId }),
  setPlayerName: (name) => set({ playerName: name }),
  setRoom: (room) => set({ room }),
  leaveRoom: () => set({ roomId: null, playerName: null, room: null }),
}));
```

### 5.7 创建 client/src/services/socketService.ts

```typescript
import { SocketEvents } from '@my-game/shared';

class SocketService {
  private ws: WebSocket | null = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
      };
    });
  }

  send<T extends keyof SocketEvents>(type: T, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  on<T extends keyof SocketEvents>(
    type: T,
    callback: (data: any) => void
  ): void {
    if (this.ws) {
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.type === type) {
          callback(message);
        }
      });
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = SocketService.getInstance();
```

### 5.8 创建 client/src/pages/Lobby.tsx

```typescript
import { useState } from 'react';
import { useRoomStore } from '../store/roomStore';
import { socketService } from '../services/socketService';

export function Lobby({ onGameStart }: { onGameStart: (state: any, playerId: string) => void }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const setRoom = useRoomStore((state) => state.setRoom);
  const setPlayerNameStore = useRoomStore((state) => state.setPlayerName);

  const handleJoinRoom = async () => {
    await socketService.connect();
    
    socketService.on('roomJoined', (data) => {
      setRoom(data.room);
      setPlayerNameStore(playerName);
    });

    socketService.on('gameStarted', () => {
      onGameStart(null, 'player-id');
    });

    socketService.send('joinRoom', { roomId, playerName });
  };

  return (
    <div className="lobby">
      <h1>游戏大厅</h1>
      <input
        type="text"
        placeholder="输入你的名字"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <input
        type="text"
        placeholder="输入房间号（可选）"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoinRoom}>加入房间</button>
    </div>
  );
}
```

### 5.9 创建 client/src/pages/GamePage.tsx

```typescript
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socketService';

export function GamePage({ gameState, playerId }: { gameState: any; playerId: string }) {
  const setGameState = useGameStore((state) => state.setGameState);

  useEffect(() => {
    socketService.on('gameStateUpdated', (data) => {
      setGameState(data.gameState);
    });

    return () => {
      socketService.disconnect();
    };
  }, [setGameState]);

  return (
    <div className="game-page">
      <h1>游戏进行中</h1>
      {/* 游戏界面 */}
    </div>
  );
}
```

### 5.10 创建 client/src/styles/global.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.lobby, .game-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: white;
  color: #667eea;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #f0f0f0;
}

input {
  padding: 0.5rem;
  margin: 0.5rem;
  border: none;
  border-radius: 4px;
}
```

### 5.11 创建 client/index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Game - Tabletopia</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.12 创建 client/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 第六步：注册到 Portal

在 `portal/src/App.tsx` 的 `games` 数组中添加新游戏信息：

```typescript
const games: GameInfo[] = [
  // ... 现有游戏
  {
    name: '我的游戏',
    subtitle: 'My Game',
    description: '简短描述游戏玩法和特色',
    icon: '🎮',
    url: 'http://localhost:3006',
    color: '#ff6b6b',
    players: '2 人',
  },
];
```

**参数说明**：
- `name`: 游戏中文名称
- `subtitle`: 游戏英文名称
- `description`: 游戏描述，1-2 句话说明玩法
- `icon`: 游戏图标（emoji）
- `url`: 游戏客户端 URL（端口根据分配规范设置）
- `color`: 主题颜色（十六进制）
- `players`: 支持的玩家人数

---

## 第七步：验证

### 7.1 安装依赖

```bash
cd /path/to/Tabletopia/my-game
npm install
```

### 7.2 运行开发服务器

```bash
npm run dev
```

这会同时启动 server 和 client。

### 7.3 运行测试

```bash
npm run test
```

确保所有测试通过。

### 7.4 通过 Portal 访问

1. 启动 Portal：
```bash
cd /path/to/Tabletopia
./run.sh --select
# 选择 portal
```

2. 在浏览器中访问 http://localhost:4000

3. 点击新游戏卡片，跳转到游戏页面

4. 测试游戏功能：
   - 创建/加入房间
   - 游戏流程
   - 实时同步
   - 游戏结束

### 7.5 自动发现验证

使用 `run.sh` 脚本验证自动发现功能：

```bash
cd /path/to/Tabletopia
./run.sh
```

脚本应该自动发现并启动新游戏项目。

---

## 接入检查清单

完成以下所有项目后，新游戏接入才算完成：

### 项目结构
- [ ] 创建了完整的目录结构
- [ ] 配置了 npm workspaces
- [ ] 配置了 TypeScript

### shared 包
- [ ] 定义了 GameState、PlayerState、GameAction 等核心类型
- [ ] 定义了游戏常量
- [ ] 通过 index.ts 统一导出

### game-logic 包
- [ ] 实现了游戏初始化逻辑
- [ ] 实现了游戏动作处理
- [ ] 实现了游戏计分逻辑
- [ ] 所有函数都是纯函数
- [ ] 编写了单元测试
- [ ] 所有测试通过

### server 包
- [ ] 实现了 WebSocket 服务器
- [ ] 实现了房间管理逻辑
- [ ] 实现了游戏逻辑处理
- [ ] 正确处理所有 Socket 事件

### client 包
- [ ] 实现了游戏状态管理
- [ ] 实现了 WebSocket 服务
- [ ] 实现了大厅页面
- [ ] 实现了游戏页面
- [ ] 配置了正确的端口

### Portal 注册
- [ ] 在 Portal 中添加了游戏信息
- [ ] 游戏卡片显示正确
- [ ] 点击能正确跳转

### 验证测试
- [ ] npm install 成功
- [ ] npm run dev 成功启动
- [ ] npm run test 所有测试通过
- [ ] 通过 Portal 能访问游戏
- [ ] 游戏功能正常
- [ ] 实时同步正常
- [ ] ./run.sh 能自动发现并启动

### 文档
- [ ] 创建了 README.md
- [ ] 创建了 rules.md（游戏规则文档）
- [ ] 规则文档格式正确

---

## 常见问题

### Q: 如何分配端口？

A: 按照 `3000, 3002, 3004, 3006...` 的顺序分配客户端端口，服务器端口为客户端端口 + 1。参考现有游戏的端口分配。

### Q: 如何调试 WebSocket 连接？

A: 在浏览器开发者工具的 Network 标签中查看 WebSocket 连接，在 Console 中查看日志输出。

### Q: 如何处理游戏状态同步？

A: 使用 Zustand store 管理本地状态，通过 WebSocket 接收服务器状态更新。

### Q: 如何确保纯函数原则？

A: 始终使用深拷贝创建新状态，不修改原状态。使用 JSON.parse(JSON.stringify()) 或 immer 等工具。

---

## 参考资源

- 现有游戏实现：`lost_cities/`、`azul/`、`splendor-duel/`
- TypeScript 文档：https://www.typescriptlang.org/docs/
- React 文档：https://react.dev/
- Zustand 文档：https://zustand-demo.pmnd.rs/
- Vitest 文档：https://vitest.dev/
- WebSocket API：https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
