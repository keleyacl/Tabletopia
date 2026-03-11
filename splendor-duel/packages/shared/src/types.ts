// ============================================================
// 璀璨宝石·对决 (Splendor Duel) - 核心类型定义
// ============================================================

/** 宝石类型枚举 */
export enum GemType {
  White = 'White',
  Blue = 'Blue',
  Green = 'Green',
  Red = 'Red',
  Black = 'Black',
  Pearl = 'Pearl',
  Gold = 'Gold',
}

/** 基础宝石类型（不含珍珠和黄金） */
export type BasicGemType =
  | GemType.White
  | GemType.Blue
  | GemType.Green
  | GemType.Red
  | GemType.Black;

/** 卡牌特殊能力枚举 */
export enum CardAbility {
  /** 获得额外回合 */
  ExtraTurn = 'ExtraTurn',
  /** 拿取1个与此卡同色的宝石 */
  TakeToken = 'TakeToken',
  /** 获得1个特权卷轴 */
  TakePrivilege = 'TakePrivilege',
  /** 复制另一张卡的颜色奖励 */
  CopyColor = 'CopyColor',
  /** 从对手处抢夺1个非黄金宝石 */
  RobToken = 'RobToken',
}

/** 坐标类型 */
export interface Coord {
  x: number;
  y: number;
}

/** 卡牌接口 */
export interface Card {
  id: string;
  level: 1 | 2 | 3;
  cost: Partial<Record<GemType, number>>;
  points: number;
  crowns: number;
  /** 购买后获得的永久宝石折扣颜色，Wild 用于 CopyColor 能力 */
  bonus: GemType | 'Wild';
  ability: CardAbility | null;
}

/** 棋盘槽位 */
export interface BoardSlot {
  x: number;
  y: number;
  gem: GemType | null;
}

/** 玩家接口 */
export interface Player {
  id: 0 | 1;
  /** 当前持有的宝石库存 */
  inventory: Record<GemType, number>;
  /** 永久宝石折扣（来自购买的卡牌） */
  bonuses: Record<GemType, number>;
  /** 持有的特权卷轴数量 */
  privileges: number;
  /** 预留的卡牌（最多3张） */
  reservedCards: Card[];
  /** 已购买的卡牌 */
  purchasedCards: Card[];
  /** 皇冠数量 */
  crowns: number;
  /** 总分 */
  score: number;
  /** 按颜色统计的卡牌分数（用于检查单色10分胜利） */
  scoresByColor: Record<GemType, number>;
}

/** 回合阶段 */
export type TurnPhase =
  | 'OptionalBefore'    // 回合开始前的可选阶段（可使用特权）
  | 'Main'              // 主动作阶段
  | 'OptionalAfter'     // 主动作后的可选阶段（可使用特权）
  | 'ResolveAbilities'  // 解决卡牌能力
  | 'DiscardExcess';    // 丢弃多余宝石

/** 胜利类型 */
export type VictoryType = 'score' | 'crowns' | 'color' | null;

/** 待解决的能力状态 */
export interface PendingAbility {
  ability: CardAbility;
  card: Card;
  /** 对于 TakeToken，记录卡牌的 bonus 颜色 */
  bonusColor?: GemType;
}

/** 游戏全局状态 */
export interface GameState {
  /** 5x5 棋盘 */
  board: BoardSlot[][];
  /** 宝石袋（未放置的宝石） */
  bag: GemType[];
  /** 剩余特权卷轴数量 */
  privilegePool: number;
  /** 各等级的牌堆 */
  decks: Record<number, Card[]>;
  /** 各等级的展示区 */
  display: Record<number, Card[]>;
  /** 两个玩家 */
  players: [Player, Player];
  /** 当前玩家索引 */
  currentPlayerIndex: 0 | 1;
  /** 当前回合阶段 */
  turnPhase: TurnPhase;
  /** 胜利者（null 表示游戏进行中） */
  winner: 0 | 1 | null;
  /** 待解决的能力 */
  pendingAbility: PendingAbility | null;
  /** 当前玩家是否已执行主动作 */
  hasPerformedMainAction: boolean;
  /** 当前玩家是否获得额外回合 */
  hasExtraTurn: boolean;
}

// ============================================================
// 游戏动作类型（Action Space）
// ============================================================

export interface TakeTokensAction {
  type: 'TakeTokens';
  coords: Coord[];
}

export interface ReserveCardAction {
  type: 'ReserveCard';
  cardId: string;
}

export interface PurchaseCardAction {
  type: 'PurchaseCard';
  cardId: string;
}

export interface UsePrivilegeAction {
  type: 'UsePrivilege';
  coord: Coord;
}

export interface RefillBoardAction {
  type: 'RefillBoard';
}

export interface DiscardTokensAction {
  type: 'DiscardTokens';
  tokens: Partial<Record<GemType, number>>;
}

export interface ResolveAbilityAction {
  type: 'ResolveAbility';
  /** TakeToken: 从棋盘选取的坐标 */
  coord?: Coord;
  /** RobToken: 要抢夺的宝石类型 */
  gemType?: GemType;
  /** CopyColor: 要复制的颜色 */
  copyColor?: GemType;
}

export interface EndTurnAction {
  type: 'EndTurn';
}

export type GameAction =
  | TakeTokensAction
  | ReserveCardAction
  | PurchaseCardAction
  | UsePrivilegeAction
  | RefillBoardAction
  | DiscardTokensAction
  | ResolveAbilityAction
  | EndTurnAction;

// ============================================================
// 房间与大厅相关类型
// ============================================================

/** 房间可见性 */
export type RoomVisibility = 'public' | 'private';

/** 房间信息 */
export interface RoomInfo {
  roomId: string;
  players: { id: number; name: string }[];
  hostId: number;
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
