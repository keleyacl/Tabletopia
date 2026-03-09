import { describe, it, expect } from 'vitest';
import { applyAction, canPlayToExpedition, getPlayerView } from '../gameActions';
import { createGameState, createRoundState } from '../gameInit';
import { Card, GameState } from '@lost-cities/shared';

function makeCard(id: number, color: string, type: string, value: number): Card {
  return { id, color: color as any, type: type as any, value };
}

describe('canPlayToExpedition', () => {
  it('空探险列可以打投资牌', () => {
    expect(canPlayToExpedition([], makeCard(1, 'red', 'wager', 0))).toBe(true);
  });

  it('空探险列可以打点数牌', () => {
    expect(canPlayToExpedition([], makeCard(1, 'red', 'number', 5))).toBe(true);
  });

  it('已有投资牌时可以继续打投资牌', () => {
    const expedition = [makeCard(1, 'red', 'wager', 0)];
    expect(canPlayToExpedition(expedition, makeCard(2, 'red', 'wager', 0))).toBe(true);
  });

  it('已有点数牌时不能打投资牌', () => {
    const expedition = [makeCard(1, 'red', 'number', 3)];
    expect(canPlayToExpedition(expedition, makeCard(2, 'red', 'wager', 0))).toBe(false);
  });

  it('点数牌必须严格递增', () => {
    const expedition = [makeCard(1, 'red', 'number', 5)];
    expect(canPlayToExpedition(expedition, makeCard(2, 'red', 'number', 6))).toBe(true);
    expect(canPlayToExpedition(expedition, makeCard(3, 'red', 'number', 5))).toBe(false);
    expect(canPlayToExpedition(expedition, makeCard(4, 'red', 'number', 3))).toBe(false);
  });

  it('投资牌后可以打点数牌', () => {
    const expedition = [makeCard(1, 'red', 'wager', 0)];
    expect(canPlayToExpedition(expedition, makeCard(2, 'red', 'number', 2))).toBe(true);
  });
});

describe('applyAction - play_card', () => {
  it('轮到自己时可以出牌到探险列', () => {
    const state = createGameState();
    const hand = state.round.hands[0];
    const card = hand[0];
    const result = applyAction(state, 0, {
      type: 'play_card',
      payload: { cardId: card.id, target: 'expedition' },
    });
    expect(result.ok).toBe(true);
    expect(state.round.phase).toBe('draw');
  });

  it('轮到自己时可以弃牌', () => {
    const state = createGameState();
    const hand = state.round.hands[0];
    const card = hand[0];
    const result = applyAction(state, 0, {
      type: 'play_card',
      payload: { cardId: card.id, target: 'discard' },
    });
    expect(result.ok).toBe(true);
    expect(state.round.phase).toBe('draw');
    expect(state.round.lastDiscard).not.toBeNull();
  });

  it('不是自己的回合不能出牌', () => {
    const state = createGameState();
    const result = applyAction(state, 1, {
      type: 'play_card',
      payload: { cardId: 1, target: 'expedition' },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Not your turn');
  });
});

describe('applyAction - draw_card', () => {
  it('出牌后可以从牌堆抽牌', () => {
    const state = createGameState();
    const hand = state.round.hands[0];
    const card = hand[0];
    // 先出牌
    applyAction(state, 0, {
      type: 'play_card',
      payload: { cardId: card.id, target: 'discard' },
    });
    // 再抽牌
    const result = applyAction(state, 0, {
      type: 'draw_card',
      payload: { source: 'deck' },
    });
    expect(result.ok).toBe(true);
    expect(state.round.phase).toBe('play');
    expect(state.round.turn).toBe(1); // 换人
  });

  it('不能抽回自己刚弃掉的牌', () => {
    const state = createGameState();
    const hand = state.round.hands[0];
    const card = hand[0];
    // 先弃牌
    applyAction(state, 0, {
      type: 'play_card',
      payload: { cardId: card.id, target: 'discard' },
    });
    // 尝试从同色弃牌堆抽牌
    const result = applyAction(state, 0, {
      type: 'draw_card',
      payload: { source: 'discard', color: card.color },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Cannot draw your just-discarded card');
  });
});

describe('applyAction - continue_round', () => {
  it('没有局结算时不能继续', () => {
    const state = createGameState();
    const result = applyAction(state, 0, { type: 'continue_round' });
    expect(result.ok).toBe(false);
  });
});

describe('getPlayerView', () => {
  it('应返回正确的玩家视角', () => {
    const state = createGameState();
    const view = getPlayerView(state, 0);
    expect(view.you).toBe(0);
    expect(view.roundsTotal).toBe(3);
    expect(view.roundIndex).toBe(1);
    expect(view.your.hand).toHaveLength(8);
    expect(view.opponent.handCount).toBe(8);
    expect(view.phase).toBe('play');
    expect(view.turn).toBe(0);
    expect(view.gameOver).toBe(false);
  });

  it('不同玩家看到不同视角', () => {
    const state = createGameState();
    const view0 = getPlayerView(state, 0);
    const view1 = getPlayerView(state, 1);
    expect(view0.you).toBe(0);
    expect(view1.you).toBe(1);
    // 玩家0的手牌是玩家1的对手手牌数
    expect(view0.your.hand.length).toBe(view1.opponent.handCount);
  });
});
