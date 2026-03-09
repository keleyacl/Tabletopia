// ============================================================
// 斋浦尔 (Jaipur) - 胜负判断与结算
// ============================================================

import type { GameState, PlayerView, TradeGoodType, RoundResult } from '@jaipur/shared';
import { TRADE_GOODS, EMPTY_TOKEN_PILES_TO_END, CAMEL_BONUS_SCORE, ROUNDS_TO_WIN } from '@jaipur/shared';

// ============================================================
// 游戏结束条件检查
// ============================================================

/**
 * 检查游戏是否应该结束
 *
 * 触发条件（满足任一即结束）：
 * 1. 牌堆耗尽且市场无法补齐至 5 张
 * 2. 6 种货物标记中有 3 种已被完全拿完
 */
export function checkGameEnd(state: GameState): boolean {
  // 条件 1：牌堆为空（市场可能已无法补齐）
  if (state.deck.length === 0) {
    return true;
  }

  // 条件 2：3 种货物标记被拿完
  let emptyPiles = 0;
  for (const goodType of TRADE_GOODS) {
    if (state.tokens[goodType].length === 0) {
      emptyPiles++;
    }
  }

  if (emptyPiles >= EMPTY_TOKEN_PILES_TO_END) {
    return true;
  }

  return false;
}

// ============================================================
// 最终结算
// ============================================================

/**
 * 计算局结算得分并确定局胜负，同时判断比赛是否结束
 *
 * 局结算规则：
 * 1. 骆驼数量多的玩家获得骆驼王奖励（5 分）
 * 2. 若骆驼数量相同，无人获得骆驼王奖励
 * 3. 总分高者赢得本局
 * 4. 平局时，奖励标记多者获胜
 * 5. 仍平局时，货物标记多者获胜
 * 6. 仍平局则本局平局（winner 为 null，不计入任何人的胜局数）
 *
 * 比赛判定：
 * - 先赢 ROUNDS_TO_WIN 局者赢得整场比赛
 */
export function calculateFinalScores(state: GameState): void {
  const [player0, player1] = state.players;

  // 骆驼王奖励
  if (player0.camels > player1.camels) {
    player0.score += CAMEL_BONUS_SCORE;
    player0.bonusTokens.push(CAMEL_BONUS_SCORE);
  } else if (player1.camels > player0.camels) {
    player1.score += CAMEL_BONUS_SCORE;
    player1.bonusTokens.push(CAMEL_BONUS_SCORE);
  }
  // 骆驼数量相同则无人获得

  // 确定本局胜负
  state.gameStatus = 'ROUND_OVER';

  if (player0.score > player1.score) {
    state.winner = 0;
  } else if (player1.score > player0.score) {
    state.winner = 1;
  } else {
    // 平局：比较奖励标记数量
    if (player0.bonusTokens.length > player1.bonusTokens.length) {
      state.winner = 0;
    } else if (player1.bonusTokens.length > player0.bonusTokens.length) {
      state.winner = 1;
    } else {
      // 仍平局：比较货物标记数量
      if (player0.tokens.length > player1.tokens.length) {
        state.winner = 0;
      } else if (player1.tokens.length > player0.tokens.length) {
        state.winner = 1;
      } else {
        // 完全平局
        state.winner = null;
      }
    }
  }

  // 记录本局结果
  const roundResult: RoundResult = {
    winner: state.winner,
    scores: [player0.score, player1.score],
  };
  state.roundResults.push(roundResult);

  // 更新局胜场数（平局不计入）
  if (state.winner !== null) {
    state.roundWins[state.winner]++;
  }

  // 判断比赛是否结束
  if (state.roundWins[0] >= ROUNDS_TO_WIN) {
    state.matchStatus = 'FINISHED';
    state.matchWinner = 0;
  } else if (state.roundWins[1] >= ROUNDS_TO_WIN) {
    state.matchStatus = 'FINISHED';
    state.matchWinner = 1;
  }
}

// ============================================================
// 玩家视角生成
// ============================================================

/**
 * 根据完整游戏状态生成指定玩家的视角
 * 隐藏对手手牌详情和牌堆内容
 */
export function getPlayerView(state: GameState, playerIndex: 0 | 1): PlayerView {
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const myPlayer = state.players[playerIndex];
  const opponent = state.players[opponentIndex];

  // 构建标记信息
  const tokenInfo = {} as Record<TradeGoodType, { remaining: number; topValue: number | null }>;
  for (const goodType of TRADE_GOODS) {
    const stack = state.tokens[goodType];
    tokenInfo[goodType] = {
      remaining: stack.length,
      topValue: stack.length > 0 ? stack[0] : null,
    };
  }

  return {
    market: [...state.market],
    myPlayer: {
      hand: [...myPlayer.hand],
      camels: myPlayer.camels,
      score: myPlayer.score,
      tokens: [...myPlayer.tokens],
      bonusTokens: [...myPlayer.bonusTokens],
    },
    opponent: {
      handCount: opponent.hand.length,
      camels: opponent.camels,
      score: opponent.score,
      tokenCount: opponent.tokens.length,
      bonusTokenCount: opponent.bonusTokens.length,
    },
    tokenInfo,
    bonusTokenInfo: {
      three: state.bonusTokens.three.length,
      four: state.bonusTokens.four.length,
      five: state.bonusTokens.five.length,
    },
    deckCount: state.deck.length,
    currentPlayerIndex: state.currentPlayerIndex,
    myPlayerIndex: playerIndex,
    gameStatus: state.gameStatus,
    winner: state.winner,
    roundWins: [...state.roundWins] as [number, number],
    currentRound: state.currentRound,
    matchStatus: state.matchStatus,
    matchWinner: state.matchWinner,
    roundResults: state.roundResults.map((r) => ({ ...r, scores: [...r.scores] as [number, number] })),
  };
}
