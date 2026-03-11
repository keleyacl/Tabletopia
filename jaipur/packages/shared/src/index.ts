// 导出所有类型
export type {
  GoodType,
  TradeGoodType,
  PremiumGoodType,
  TakeOneAction,
  TakeCamelsAction,
  ExchangeAction,
  SellAction,
  GameAction,
  Player,
  BonusTokens,
  RoundResult,
  GameState,
  OpponentView,
  PlayerView,
  ActionResult,
  RoomPlayer,
  RoomState,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
  RoomVisibility,
  RoomListItem,
  JoinRequest,
} from './types';

// 导出运行时常量（来自 types）
export { PREMIUM_GOODS, TRADE_GOODS } from './types';

// 导出所有常量
export {
  DECK_COMPOSITION,
  TOTAL_CARDS,
  MAX_HAND_SIZE,
  MARKET_SIZE,
  INITIAL_MARKET_CAMELS,
  INITIAL_HAND_SIZE,
  CAMEL_BONUS_SCORE,
  MIN_EXCHANGE_COUNT,
  MIN_PREMIUM_SELL_COUNT,
  EMPTY_TOKEN_PILES_TO_END,
  ROUNDS_TO_WIN,
  MAX_ROUNDS,
  TOKEN_VALUES,
  BONUS_TOKENS_THREE,
  BONUS_TOKENS_FOUR,
  BONUS_TOKENS_FIVE,
  GOOD_NAMES,
  GOOD_ICONS,
  GOOD_COLORS,
} from './constants';
