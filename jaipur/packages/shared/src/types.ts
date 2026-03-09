// ============================================================
// 斋浦尔 (Jaipur) - 核心类型定义
// ============================================================

/** 所有货物类型（含骆驼） */
export type GoodType = 'DIAMOND' | 'GOLD' | 'SILVER' | 'CLOTH' | 'SPICE' | 'LEATHER' | 'CAMEL';

/** 可交易的货物类型（不含骆驼） */
export type TradeGoodType = Exclude<GoodType, 'CAMEL'>;

/** 高级货物类型（出售至少需要 2 张） */
export type PremiumGoodType = 'DIAMOND' | 'GOLD' | 'SILVER';

/** 所有高级货物类型的集合，用于运行时判断 */
export const PREMIUM_GOODS: readonly PremiumGoodType[] = ['DIAMOND', 'GOLD', 'SILVER'] as const;

/** 所有可交易货物类型的集合 */
export const TRADE_GOODS: readonly TradeGoodType[] = [
  'DIAMOND', 'GOLD', 'SILVER', 'CLOTH', 'SPICE', 'LEATHER',
] as const;

// ============================================================
// 游戏动作类型
// ============================================================

/** 取一张牌 */
export interface TakeOneAction {
  type: 'TAKE_ONE';
  /** 市场中目标牌的索引（0-4） */
  marketIndex: number;
}

/** 取所有骆驼 */
export interface TakeCamelsAction {
  type: 'TAKE_CAMELS';
}

/** 交换 */
export interface ExchangeAction {
  type: 'EXCHANGE';
  /** 选中的市场牌索引列表 */
  marketIndices: number[];
  /** 选中的手牌索引列表 */
  handIndices: number[];
  /** 用于交换的骆驼数量 */
  camelCount: number;
}

/** 出售货物 */
export interface SellAction {
  type: 'SELL';
  /** 出售的货物类型 */
  goodType: TradeGoodType;
  /** 出售的数量 */
  count: number;
}

/** 游戏动作联合类型 */
export type GameAction = TakeOneAction | TakeCamelsAction | ExchangeAction | SellAction;

// ============================================================
// 玩家状态
// ============================================================

/** 玩家状态 */
export interface Player {
  /** 手牌（不含骆驼） */
  hand: GoodType[];
  /** 骆驼圈中的骆驼数量 */
  camels: number;
  /** 已获得的总分数 */
  score: number;
  /** 已获得的货物标记分值列表 */
  tokens: number[];
  /** 已获得的奖励标记分值列表 */
  bonusTokens: number[];
}

// ============================================================
// 奖励标记
// ============================================================

/** 奖励标记堆 */
export interface BonusTokens {
  /** 出售 3 张货物的奖励标记堆 */
  three: number[];
  /** 出售 4 张货物的奖励标记堆 */
  four: number[];
  /** 出售 5 张及以上货物的奖励标记堆 */
  five: number[];
}

// ============================================================
// 游戏状态
// ============================================================

/** 单局结果记录 */
export interface RoundResult {
  /** 局胜者（平局为 null） */
  winner: 0 | 1 | null;
  /** 两个玩家的得分 */
  scores: [number, number];
}

/** 游戏状态 */
export interface GameState {
  /** 牌堆（未翻开的牌） */
  deck: GoodType[];
  /** 市场（始终 5 张，除非牌堆耗尽） */
  market: GoodType[];
  /** 两个玩家的状态 */
  players: [Player, Player];
  /** 各种货物的分值标记堆（降序排列，栈顶为最高分） */
  tokens: Record<TradeGoodType, number[]>;
  /** 奖励标记堆 */
  bonusTokens: BonusTokens;
  /** 当前行动玩家索引 */
  currentPlayerIndex: 0 | 1;
  /** 当前局的状态 */
  gameStatus: 'PLAYING' | 'ROUND_OVER';
  /** 当前局获胜玩家索引（局结束时设置） */
  winner: 0 | 1 | null;
  /** 两个玩家各赢的局数 */
  roundWins: [number, number];
  /** 当前第几局（从 1 开始） */
  currentRound: number;
  /** 整场比赛状态 */
  matchStatus: 'PLAYING' | 'FINISHED';
  /** 整场比赛胜者 */
  matchWinner: 0 | 1 | null;
  /** 每局结果记录 */
  roundResults: RoundResult[];
}

// ============================================================
// 玩家视角（用于客户端，隐藏敏感信息）
// ============================================================

/** 对手的可见信息 */
export interface OpponentView {
  /** 手牌数量（不显示具体内容） */
  handCount: number;
  /** 骆驼数量 */
  camels: number;
  /** 已获得的分数 */
  score: number;
  /** 已获得的标记数量 */
  tokenCount: number;
  /** 已获得的奖励标记数量 */
  bonusTokenCount: number;
}

/** 玩家视角的游戏状态 */
export interface PlayerView {
  /** 市场牌（公开） */
  market: GoodType[];
  /** 当前玩家的完整信息 */
  myPlayer: Player;
  /** 对手的有限信息 */
  opponent: OpponentView;
  /** 各货物标记堆剩余数量和栈顶值 */
  tokenInfo: Record<TradeGoodType, { remaining: number; topValue: number | null }>;
  /** 奖励标记堆剩余数量 */
  bonusTokenInfo: { three: number; four: number; five: number };
  /** 牌堆剩余数量 */
  deckCount: number;
  /** 当前行动玩家索引 */
  currentPlayerIndex: 0 | 1;
  /** 自己的玩家索引 */
  myPlayerIndex: 0 | 1;
  /** 当前局的状态 */
  gameStatus: 'PLAYING' | 'ROUND_OVER';
  /** 当前局获胜玩家索引 */
  winner: 0 | 1 | null;
  /** 两个玩家各赢的局数 */
  roundWins: [number, number];
  /** 当前第几局（从 1 开始） */
  currentRound: number;
  /** 整场比赛状态 */
  matchStatus: 'PLAYING' | 'FINISHED';
  /** 整场比赛胜者 */
  matchWinner: 0 | 1 | null;
  /** 每局结果记录 */
  roundResults: RoundResult[];
}

// ============================================================
// 动作结果
// ============================================================

/** 动作执行结果 */
export interface ActionResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息（失败时） */
  error?: string;
  /** 更新后的游戏状态（成功时） */
  state?: GameState;
}

// ============================================================
// 房间与 Socket 相关类型
// ============================================================

/** 房间中的玩家信息 */
export interface RoomPlayer {
  /** Socket ID */
  socketId: string;
  /** 玩家昵称 */
  name: string;
  /** 玩家在游戏中的索引 */
  playerIndex: 0 | 1;
  /** 是否在线 */
  connected: boolean;
  /** 重连令牌 */
  reconnectToken: string;
}

/** 房间状态 */
export interface RoomState {
  /** 房间码 */
  roomCode: string;
  /** 房间中的玩家列表 */
  players: RoomPlayer[];
  /** 游戏是否已开始 */
  gameStarted: boolean;
}

/** 聊天消息 */
export interface ChatMessage {
  /** 发送者昵称 */
  sender: string;
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  timestamp: number;
}

/** Socket 事件：客户端 → 服务端 */
export interface ClientToServerEvents {
  'room:create': (data: { name: string }) => void;
  'room:join': (data: { name: string; roomCode: string }) => void;
  'room:reconnect': (data: { reconnectToken: string }) => void;
  'game:action': (data: { action: GameAction }) => void;
  'game:next_round': () => void;
  'game:rematch': () => void;
  'chat:message': (data: { content: string }) => void;
}

/** Socket 事件：服务端 → 客户端 */
export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; playerIndex: 0 | 1; reconnectToken: string }) => void;
  'room:joined': (data: { roomCode: string; playerIndex: 0 | 1; reconnectToken: string }) => void;
  'room:player_joined': (data: { name: string }) => void;
  'room:player_disconnected': (data: { name: string }) => void;
  'room:player_reconnected': (data: { name: string }) => void;
  'game:started': (data: { playerView: PlayerView }) => void;
  'game:state_update': (data: { playerView: PlayerView }) => void;
  'game:error': (data: { message: string }) => void;
  'game:round_ended': (data: { playerView: PlayerView; roundScores: [number, number]; roundWinner: 0 | 1 | null; roundWins: [number, number] }) => void;
  'game:new_round': (data: { playerView: PlayerView }) => void;
  'game:match_ended': (data: { playerView: PlayerView; finalScores: [number, number]; matchWinner: 0 | 1 | null; roundResults: RoundResult[] }) => void;
  'game:rematch_started': (data: { playerView: PlayerView }) => void;
  'chat:message': (data: ChatMessage) => void;
}
