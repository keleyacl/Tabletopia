// ============================================================
// 失落的城市 (Lost Cities) - 核心类型定义
// ============================================================

/** 颜色类型 */
export type Color = 'red' | 'green' | 'blue' | 'yellow' | 'white';

/** 卡牌类型 */
export type CardType = 'wager' | 'number';

/** 卡牌接口 */
export interface Card {
  id: number;
  color: Color;
  type: CardType;
  value: number;
}

/** 颜色显示信息 */
export interface ColorInfo {
  id: Color;
  name: string;
}

/** 探险列（按颜色索引） */
export type Expeditions = Record<Color, Card[]>;

/** 弃牌堆（按颜色索引） */
export type DiscardPiles = Record<Color, Card[]>;

/** 弃牌堆顶牌（按颜色索引） */
export type DiscardTops = Record<Color, Card | null>;

/** 单局状态 */
export interface RoundState {
  deck: Card[];
  discardPiles: DiscardPiles;
  hands: [Card[], Card[]];
  expeditions: [Expeditions, Expeditions];
  turn: number;
  startingPlayer: number;
  phase: 'play' | 'draw';
  lastDiscard: LastDiscard | null;
  finished: boolean;
}

/** 最后弃牌记录 */
export interface LastDiscard {
  playerIndex: number;
  cardId: number;
  color: Color;
}

/** 单局历史记录 */
export interface RoundHistory {
  roundIndex: number;
  scores: [number, number];
}

/** 局结算结果 */
export interface RoundResult {
  roundIndex: number;
  scores: [number, number];
  winner: number;
  matchWins: [number, number];
  canContinue: boolean;
  ready: number[];
}

/** 游戏全局状态 */
export interface GameState {
  roundsTotal: number;
  roundIndex: number;
  round: RoundState;
  scores: [number, number];
  history: RoundHistory[];
  roundResult: RoundResult | null;
}

/** 颜色计分详情 */
export interface ColorScores {
  scores: Record<Color, number>;
  total: number;
}

// ============================================================
// 玩家视角类型
// ============================================================

/** 局结算结果（玩家视角） */
export interface RoundResultView {
  roundIndex: number;
  scores: [number, number];
  winner: number;
  matchWins: [number, number];
  canContinue: boolean;
  readyCount: number;
  youReady: boolean;
}

/** 玩家视角的游戏状态 */
export interface PlayerView {
  you: number;
  roundsTotal: number;
  roundIndex: number;
  scores: [number, number];
  matchWins: [number, number];
  history: RoundHistory[];
  roundScores: [number, number];
  roundResult: RoundResultView | null;
  gameOver: boolean;
  turn: number;
  phase: 'play' | 'draw';
  deckCount: number;
  discardTops: DiscardTops;
  your: {
    hand: Card[];
    expeditions: Expeditions;
  };
  opponent: {
    handCount: number;
    expeditions: Expeditions;
  };
  lastDiscard: LastDiscard | null;
  finished: boolean;
}

// ============================================================
// 大厅类型
// ============================================================

/** 房间可见性 */
export type RoomVisibility = 'public' | 'private';

/** 房间列表项（用于大厅展示） */
export interface RoomListItem {
  roomCode: string;
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
  roomCode: string;
  timestamp: number;
}

// ============================================================
// 房间类型
// ============================================================

/** 房间玩家信息 */
export interface RoomPlayer {
  id: string;
  name: string;
  seat: number;
  connected: boolean;
}

/** 房间状态（玩家视角） */
export interface RoomStateView {
  code: string;
  players: RoomPlayer[];
  you: string;
  playerIndex: number;
}

// ============================================================
// 消息与动作类型
// ============================================================

/** 出牌动作 */
export interface PlayCardAction {
  type: 'play_card';
  payload: {
    cardId: number;
    target: 'expedition' | 'discard';
  };
}

/** 抽牌动作 */
export interface DrawCardAction {
  type: 'draw_card';
  payload: {
    source: 'deck' | 'discard';
    color?: Color;
  };
}

/** 继续下一局动作 */
export interface ContinueRoundAction {
  type: 'continue_round';
}

/** 游戏动作联合类型 */
export type GameAction = PlayCardAction | DrawCardAction | ContinueRoundAction;

/** 动作结果 */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** 客户端发送的消息类型 */
export type ClientMessageType =
  | 'room:create'
  | 'room:join'
  | 'room:reconnect'
  | 'game:action'
  | 'game:restart'
  | 'room:chat'
  | 'lobby:list'
  | 'lobby:join_request'
  | 'lobby:join_response'
  | 'lobby:cancel_request';

/** 客户端消息 */
export interface ClientMessage {
  type: ClientMessageType;
  payload?: any;
}

/** 服务端发送的消息类型 */
export type ServerMessageType =
  | 'room:state'
  | 'game:state'
  | 'room:token'
  | 'room:chat'
  | 'error'
  | 'lobby:room_list'
  | 'lobby:join_request_received'
  | 'lobby:join_approved'
  | 'lobby:join_rejected'
  | 'lobby:request_cancelled';

/** 服务端消息 */
export interface ServerMessage {
  type: ServerMessageType;
  payload: any;
}

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;
}
