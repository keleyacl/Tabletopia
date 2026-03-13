// ============================================================
// 花砖物语 (Azul) - 核心类型定义
// ============================================================

/**
 * 瓷砖颜色枚举
 * 包含 5 种标准颜色和 1 个起始玩家标记
 */
export enum TileColor {
  Blue = 'BLUE',
  Yellow = 'YELLOW',
  Red = 'RED',
  Green = 'GREEN',
  White = 'WHITE',
  FirstPlayer = 'FIRST_PLAYER',
}

/** 标准的 5 种瓷砖颜色（不含起始玩家标记） */
export const STANDARD_COLORS: TileColor[] = [
  TileColor.Blue,
  TileColor.Yellow,
  TileColor.Red,
  TileColor.Green,
  TileColor.White,
];

/** 工厂显示区：包含若干瓷砖 */
export type Factory = TileColor[];

/**
 * 玩家板状态
 */
export interface PlayerBoard {
  /** 玩家唯一 ID */
  id: string;
  /** 玩家名称 */
  name: string;
  /**
   * 模式线（左侧）：5 行，第 i 行容量为 i+1
   * null 表示该位置为空
   */
  patternLines: (TileColor | null)[][];
  /**
   * 墙面（右侧）：5x5 布尔矩阵
   * true 表示该位置已放置瓷砖
   */
  wall: boolean[][];
  /**
   * 地板线（扣分区）：最多 7 个位置
   * 存放溢出的瓷砖和起始玩家标记
   */
  floorLine: (TileColor | null)[];
  /** 当前分数 */
  score: number;
}

/**
 * 游戏阶段
 * - PICKING: 玩家从工厂/中心拿砖阶段
 * - TILING: 回合结束，将模式线移至墙面并计分
 * - END: 游戏结束
 */
export type GamePhase = 'PICKING' | 'TILING' | 'END';

/**
 * 游戏总状态
 */
export interface GameState {
  /** 所有玩家的板状态 */
  players: PlayerBoard[];
  /** 当前行动玩家的索引 */
  currentPlayerIndex: number;
  /** 所有工厂 */
  factories: Factory[];
  /** 桌子中心区域的瓷砖 */
  centerPot: TileColor[];
  /** 抽取袋中的瓷砖 */
  bag: TileColor[];
  /** 弃置堆中的瓷砖 */
  discardPile: TileColor[];
  /** 当前游戏阶段 */
  phase: GamePhase;
  /** 当前回合数 */
  round: number;
  /** 本轮是否已有人从中心拿过砖（用于判断起始玩家标记） */
  centerTaken: boolean;
}

// ============================================================
// Socket 通信协议 - 客户端发送的操作
// ============================================================

/** 创建房间 */
export interface CreateRoomAction {
  type: 'CREATE_ROOM';
  playerName: string;
}

/** 加入房间 */
export interface JoinRoomAction {
  type: 'JOIN_ROOM';
  roomId: string;
  playerName: string;
}

/** 离开房间 */
export interface LeaveRoomAction {
  type: 'LEAVE_ROOM';
  roomId: string;
  playerId: string;
}

/** 开始游戏 */
export interface StartGameAction {
  type: 'START_GAME';
  roomId: string;
}

/** 从工厂拿砖 */
export interface TakeFromFactoryAction {
  type: 'TAKE_FROM_FACTORY';
  roomId: string;
  playerId: string;
  factoryIndex: number;
  color: TileColor;
  targetLineIndex: number;
}

/** 从中心拿砖 */
export interface TakeFromCenterAction {
  type: 'TAKE_FROM_CENTER';
  roomId: string;
  playerId: string;
  color: TileColor;
  targetLineIndex: number;
}

/** 所有客户端操作的联合类型 */
export type GameAction =
  | CreateRoomAction
  | JoinRoomAction
  | LeaveRoomAction
  | StartGameAction
  | TakeFromFactoryAction
  | TakeFromCenterAction;

// ============================================================
// Socket 通信协议 - 服务端推送的事件
// ============================================================

/** 房间可见性 */
export type RoomVisibility = 'public' | 'private';

/** 房间信息 */
export interface RoomInfo {
  roomId: string;
  players: { id: string; name: string }[];
  hostId: string;
  gameStarted: boolean;
  visibility: RoomVisibility;
}

/** 房间列表项（用于大厅展示） */
export interface RoomListItem {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
  createdAt: string;
}

/** 加入申请 */
export interface JoinRequest {
  requestId: string;
  playerName: string;
  roomId: string;
  timestamp: number;
}

/** 房间已创建 */
export interface RoomCreatedEvent {
  type: 'ROOM_CREATED';
  roomInfo: RoomInfo;
  playerId: string;
}

/** 房间已更新（有人加入/离开） */
export interface RoomUpdatedEvent {
  type: 'ROOM_UPDATED';
  roomInfo: RoomInfo;
}

/** 游戏已开始 */
export interface GameStartedEvent {
  type: 'GAME_STARTED';
  gameState: GameState;
}

/** 游戏状态已更新 */
export interface GameStateUpdatedEvent {
  type: 'GAME_STATE_UPDATED';
  gameState: GameState;
}

/** 回合计分完成 */
export interface RoundScoredEvent {
  type: 'ROUND_SCORED';
  gameState: GameState;
  scoreDetails: RoundScoreDetail[];
}

/** 单个玩家的回合计分明细 */
export interface RoundScoreDetail {
  playerId: string;
  tilesPlaced: { row: number; col: number; score: number }[];
  floorPenalty: number;
  totalRoundScore: number;
}

/** 游戏结束 */
export interface GameEndedEvent {
  type: 'GAME_ENDED';
  gameState: GameState;
  finalScores: FinalScoreDetail[];
}

/** 最终计分明细 */
export interface FinalScoreDetail {
  playerId: string;
  playerName: string;
  baseScore: number;
  completedRows: number;
  rowBonus: number;
  completedCols: number;
  colBonus: number;
  completedColors: number;
  colorBonus: number;
  finalScore: number;
}

/** 错误事件 */
export interface ErrorEvent {
  type: 'ERROR';
  message: string;
}

/** 玩家断线 */
export interface PlayerDisconnectedEvent {
  type: 'PLAYER_DISCONNECTED';
  playerId: string;
  playerName: string;
}

/** 玩家重连 */
export interface PlayerReconnectedEvent {
  type: 'PLAYER_RECONNECTED';
  playerId: string;
  playerName: string;
}

// ============================================================
// 重新开始投票
// ============================================================

/** 重新开始投票状态 */
export interface RestartVoteInfo {
  /** 发起者 playerId */
  requestedBy: string;
  /** 发起者名称 */
  requestedByName: string;
  /** 已同意的玩家 ID 列表 */
  votedPlayers: string[];
  /** 总玩家数 */
  totalPlayers: number;
}

/** 重新开始投票更新事件 */
export interface RestartVoteUpdateEvent {
  type: 'RESTART_VOTE_UPDATE';
  voteInfo: RestartVoteInfo;
}

/** 重新开始投票被拒绝事件 */
export interface RestartVoteRejectedEvent {
  type: 'RESTART_VOTE_REJECTED';
  rejectedBy: string;
  rejectedByName: string;
}

/** 游戏重新开始事件 */
export interface GameRestartedEvent {
  type: 'GAME_RESTARTED';
  gameState: GameState;
}

/** 所有服务端事件的联合类型 */
export type GameEvent =
  | RoomCreatedEvent
  | RoomUpdatedEvent
  | GameStartedEvent
  | GameStateUpdatedEvent
  | RoundScoredEvent
  | GameEndedEvent
  | ErrorEvent
  | PlayerDisconnectedEvent
  | PlayerReconnectedEvent
  | RestartVoteUpdateEvent
  | RestartVoteRejectedEvent
  | GameRestartedEvent;
