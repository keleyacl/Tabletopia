// ============================================================
// 斋浦尔 (Jaipur) - 游戏初始化
// ============================================================

import type { GameState, GoodType, TradeGoodType, Player, BonusTokens } from '@jaipur/shared';
import {
  DECK_COMPOSITION,
  TOKEN_VALUES,
  BONUS_TOKENS_THREE,
  BONUS_TOKENS_FOUR,
  BONUS_TOKENS_FIVE,
  INITIAL_MARKET_CAMELS,
  MARKET_SIZE,
  INITIAL_HAND_SIZE,
  TRADE_GOODS,
  ROUNDS_TO_WIN,
} from '@jaipur/shared';
import { shuffle } from './utils';

/**
 * 创建完整的牌组（55 张）
 * 按照各货物类型的数量生成对应数量的牌
 */
export function createDeck(): GoodType[] {
  const deck: GoodType[] = [];
  const goodTypes = Object.keys(DECK_COMPOSITION) as GoodType[];

  for (const goodType of goodTypes) {
    const count = DECK_COMPOSITION[goodType];
    for (let i = 0; i < count; i++) {
      deck.push(goodType);
    }
  }

  return deck;
}

/**
 * 初始化货物分值标记堆
 * 每种货物的标记按降序排列（栈顶为最高分）
 */
export function initializeTokens(): Record<TradeGoodType, number[]> {
  const tokens = {} as Record<TradeGoodType, number[]>;

  for (const goodType of TRADE_GOODS) {
    tokens[goodType] = [...TOKEN_VALUES[goodType]];
  }

  return tokens;
}

/**
 * 初始化奖励标记堆
 * 每种奖励标记洗混后随机排列
 */
export function initializeBonusTokens(): BonusTokens {
  return {
    three: shuffle([...BONUS_TOKENS_THREE]),
    four: shuffle([...BONUS_TOKENS_FOUR]),
    five: shuffle([...BONUS_TOKENS_FIVE]),
  };
}

/**
 * 创建初始玩家状态
 */
function createPlayer(): Player {
  return {
    hand: [],
    camels: 0,
    score: 0,
    tokens: [],
    bonusTokens: [],
  };
}

/**
 * 为玩家发牌
 * 从牌堆顶抽取指定数量的牌，骆驼自动进入骆驼圈
 */
function dealCards(deck: GoodType[], player: Player, count: number): void {
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) break;
    const card = deck.shift()!;
    if (card === 'CAMEL') {
      player.camels++;
    } else {
      player.hand.push(card);
    }
  }
}

/**
 * 初始化完整的游戏状态
 *
 * 流程：
 * 1. 创建完整牌组（55 张）
 * 2. 从牌组中取出 3 张骆驼放入市场
 * 3. 洗混剩余牌组
 * 4. 从牌堆顶取 2 张放入市场（市场共 5 张）
 * 5. 每位玩家从牌堆顶抽 5 张手牌（骆驼自动进骆驼圈）
 * 6. 初始化分值标记和奖励标记
 */
export function initializeGame(): GameState {
  // 1. 创建完整牌组
  const allCards = createDeck();

  // 2. 取出 3 张骆驼放入市场
  const market: GoodType[] = [];
  const remainingCards: GoodType[] = [];

  let camelsPlaced = 0;
  for (const card of allCards) {
    if (card === 'CAMEL' && camelsPlaced < INITIAL_MARKET_CAMELS) {
      market.push('CAMEL');
      camelsPlaced++;
    } else {
      remainingCards.push(card);
    }
  }

  // 3. 洗混剩余牌组
  shuffle(remainingCards);

  // 4. 从牌堆顶取 2 张放入市场（市场共 5 张）
  const cardsToFillMarket = MARKET_SIZE - INITIAL_MARKET_CAMELS;
  for (let i = 0; i < cardsToFillMarket; i++) {
    if (remainingCards.length > 0) {
      market.push(remainingCards.shift()!);
    }
  }

  // 5. 创建玩家并发牌
  const player1 = createPlayer();
  const player2 = createPlayer();

  dealCards(remainingCards, player1, INITIAL_HAND_SIZE);
  dealCards(remainingCards, player2, INITIAL_HAND_SIZE);

  // 6. 初始化分值标记和奖励标记
  const tokens = initializeTokens();
  const bonusTokens = initializeBonusTokens();

  return {
    deck: remainingCards,
    market,
    players: [player1, player2],
    tokens,
    bonusTokens,
    currentPlayerIndex: 0,
    gameStatus: 'PLAYING',
    winner: null,
    roundWins: [0, 0],
    currentRound: 1,
    matchStatus: 'PLAYING',
    matchWinner: null,
    roundResults: [],
  };
}

/**
 * 初始化新一局游戏（保留比赛进度信息）
 *
 * 流程：
 * 1. 保留 roundWins、currentRound（+1）、roundResults
 * 2. 重新初始化牌堆、市场、玩家手牌/骆驼/分数/标记、奖励标记
 * 3. 上一局输家先手（若平局则保持原先手）
 */
export function initializeNewRound(prevState: GameState): GameState {
  // 确定先手：上一局输家先手，平局则保持原先手
  const lastRoundResult = prevState.roundResults[prevState.roundResults.length - 1];
  let firstPlayer: 0 | 1 = 0;
  if (lastRoundResult) {
    if (lastRoundResult.winner === 0) {
      firstPlayer = 1; // 上局赢家是 0，输家 1 先手
    } else if (lastRoundResult.winner === 1) {
      firstPlayer = 0; // 上局赢家是 1，输家 0 先手
    } else {
      // 平局，保持上一局的先手
      firstPlayer = prevState.currentPlayerIndex;
    }
  }

  // 重新初始化游戏（与 initializeGame 相同的流程）
  const allCards = createDeck();

  const market: GoodType[] = [];
  const remainingCards: GoodType[] = [];

  let camelsPlaced = 0;
  for (const card of allCards) {
    if (card === 'CAMEL' && camelsPlaced < INITIAL_MARKET_CAMELS) {
      market.push('CAMEL');
      camelsPlaced++;
    } else {
      remainingCards.push(card);
    }
  }

  shuffle(remainingCards);

  const cardsToFillMarket = MARKET_SIZE - INITIAL_MARKET_CAMELS;
  for (let i = 0; i < cardsToFillMarket; i++) {
    if (remainingCards.length > 0) {
      market.push(remainingCards.shift()!);
    }
  }

  const player1 = createPlayer();
  const player2 = createPlayer();

  dealCards(remainingCards, player1, INITIAL_HAND_SIZE);
  dealCards(remainingCards, player2, INITIAL_HAND_SIZE);

  const tokens = initializeTokens();
  const bonusTokens = initializeBonusTokens();

  return {
    deck: remainingCards,
    market,
    players: [player1, player2],
    tokens,
    bonusTokens,
    currentPlayerIndex: firstPlayer,
    gameStatus: 'PLAYING',
    winner: null,
    roundWins: [...prevState.roundWins] as [number, number],
    currentRound: prevState.currentRound + 1,
    matchStatus: 'PLAYING',
    matchWinner: null,
    roundResults: [...prevState.roundResults],
  };
}
