// ============================================================
// 失落的城市 - 游戏动作处理
// ============================================================

import {
  Card,
  Color,
  GameState,
  GameAction,
  PlayerView,
  RoundResultView,
  ActionResult,
  DiscardTops,
} from '@lost-cities/shared';
import { COLORS } from '@lost-cities/shared';
import { scoreAll, calcMatchWins, roundWinner, isGameOver } from './gameScoring';
import { getTopDiscard } from './utils';
import { createRoundState } from './gameInit';

/**
 * 判断能否将卡牌打入探险列
 */
export function canPlayToExpedition(expedition: Card[], card: Card): boolean {
  if (card.type === 'wager') {
    if (expedition.length === 0) return true;
    return expedition.every((c) => c.type === 'wager');
  }
  // number card
  const lastNumber = [...expedition].reverse().find((c) => c.type === 'number');
  if (!lastNumber) return true;
  return card.value > lastNumber.value;
}

/**
 * 生成玩家视角的游戏状态
 */
export function getPlayerView(state: GameState, playerIndex: number): PlayerView {
  const opponent = playerIndex === 0 ? 1 : 0;
  const round = state.round;
  const matchWins = calcMatchWins(state.history);
  const roundScores: [number, number] = [
    scoreAll(round.expeditions[0]).total,
    scoreAll(round.expeditions[1]).total,
  ];

  const discardTops: DiscardTops = {} as DiscardTops;
  for (const color of COLORS) {
    discardTops[color] = getTopDiscard(round.discardPiles, color);
  }

  let roundResultView: RoundResultView | null = null;
  if (state.roundResult) {
    roundResultView = {
      roundIndex: state.roundResult.roundIndex,
      scores: state.roundResult.scores,
      winner: state.roundResult.winner,
      matchWins: state.roundResult.matchWins,
      canContinue: state.roundResult.canContinue,
      readyCount: state.roundResult.ready.length,
      youReady: state.roundResult.ready.includes(playerIndex),
    };
  }

  return {
    you: playerIndex,
    roundsTotal: state.roundsTotal,
    roundIndex: state.roundIndex,
    scores: state.scores,
    matchWins,
    history: state.history,
    roundScores,
    roundResult: roundResultView,
    gameOver: isGameOver(state),
    turn: round.turn,
    phase: round.phase,
    deckCount: round.deck.length,
    discardTops,
    your: {
      hand: round.hands[playerIndex],
      expeditions: round.expeditions[playerIndex],
    },
    opponent: {
      handCount: round.hands[opponent].length,
      expeditions: round.expeditions[opponent],
    },
    lastDiscard: round.lastDiscard,
    finished: round.finished,
  };
}

/**
 * 执行玩家动作
 */
export function applyAction(
  state: GameState,
  playerIndex: number,
  action: GameAction
): ActionResult {
  const round = state.round;

  if (action.type === 'continue_round') {
    if (!state.roundResult || !state.roundResult.canContinue) {
      return { ok: false, error: 'No round to continue' };
    }
    if (!state.roundResult.ready.includes(playerIndex)) {
      state.roundResult.ready.push(playerIndex);
    }
    if (state.roundResult.ready.length < 2) {
      return { ok: true };
    }
    const nextStarter = state.round?.startingPlayer === 0 ? 1 : 0;
    state.roundIndex += 1;
    state.round = createRoundState(nextStarter);
    state.roundResult = null;
    return { ok: true };
  }

  if (state.roundResult?.canContinue) {
    return { ok: false, error: 'Waiting players to continue' };
  }
  if (round.finished) return { ok: false, error: 'Round finished' };
  if (round.turn !== playerIndex) return { ok: false, error: 'Not your turn' };

  if (action.type === 'play_card') {
    if (round.phase !== 'play') return { ok: false, error: 'Must play before drawing' };
    const { cardId, target } = action.payload || {};
    const hand = round.hands[playerIndex];
    const cardIndex = hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { ok: false, error: 'Card not in hand' };
    const card = hand[cardIndex];
    if (target === 'expedition') {
      const expedition = round.expeditions[playerIndex][card.color];
      if (!canPlayToExpedition(expedition, card))
        return { ok: false, error: 'Invalid expedition play' };
      expedition.push(card);
      hand.splice(cardIndex, 1);
      round.lastDiscard = null;
    } else if (target === 'discard') {
      round.discardPiles[card.color].push(card);
      hand.splice(cardIndex, 1);
      round.lastDiscard = { playerIndex, cardId: card.id, color: card.color };
    } else {
      return { ok: false, error: 'Invalid target' };
    }
    round.phase = 'draw';
    return { ok: true };
  }

  if (action.type === 'draw_card') {
    if (round.phase !== 'draw') return { ok: false, error: 'Must play before drawing' };
    const { source, color } = action.payload || {};
    let drawn: Card | null = null;
    if (source === 'deck') {
      if (round.deck.length === 0) return { ok: false, error: 'Deck empty' };
      drawn = round.deck.pop()!;
    } else if (source === 'discard') {
      if (!color || !round.discardPiles[color as Color] || round.discardPiles[color as Color].length === 0) {
        return { ok: false, error: 'Discard empty' };
      }
      if (
        round.lastDiscard &&
        round.lastDiscard.playerIndex === playerIndex &&
        round.lastDiscard.color === color
      ) {
        return { ok: false, error: 'Cannot draw your just-discarded card' };
      }
      drawn = round.discardPiles[color as Color].pop()!;
    } else {
      return { ok: false, error: 'Invalid draw source' };
    }

    round.hands[playerIndex].push(drawn);
    round.phase = 'play';
    round.turn = playerIndex === 0 ? 1 : 0;
    round.lastDiscard = null;

    if (round.deck.length === 0) {
      round.finished = true;
      const score0 = scoreAll(round.expeditions[0]).total;
      const score1 = scoreAll(round.expeditions[1]).total;
      state.scores[0] += score0;
      state.scores[1] += score1;
      state.history.push({
        roundIndex: state.roundIndex,
        scores: [score0, score1],
      });
      state.roundResult = {
        roundIndex: state.roundIndex,
        scores: [score0, score1],
        winner: roundWinner(score0, score1),
        matchWins: calcMatchWins(state.history),
        canContinue: state.roundIndex < state.roundsTotal,
        ready: [],
      };
    }

    return { ok: true };
  }

  return { ok: false, error: 'Unknown action' };
}
