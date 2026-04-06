import { describe, it, expect } from 'vitest';
import { createInitialState, initializeGame, drawToHand, discardTile, transferScore, shuffleWall } from '../src/index.js';
import { createStandardRule } from '../src/defaults.js';

const rule = createStandardRule();

describe('createInitialState', () => {
  it('各プレイヤーの初期点数が設定されている', () => {
    const state = createInitialState(rule);
    for (const player of state.players) {
      expect(player.score.points).toBe(25000);
    }
  });

  it('牌山は空の状態で始まる', () => {
    const state = createInitialState(rule);
    expect(state.wall.tiles).toHaveLength(0);
  });
});

describe('shuffleWall', () => {
  it('ルールで定義された全牌が牌山に入る', () => {
    const state = shuffleWall(createInitialState(rule));
    const expected = rule.tiles.reduce((sum, t) => sum + t.count, 0);
    expect(state.wall.tiles).toHaveLength(expected); // 136枚
  });

  it('全ての牌が表向きでない', () => {
    const state = shuffleWall(createInitialState(rule));
    expect(state.wall.tiles.every(t => !t.faceUp)).toBe(true);
  });
});

describe('initializeGame', () => {
  it('各プレイヤーが initialHandCount 枚の手牌を持つ', () => {
    const state = initializeGame(createInitialState(rule));
    for (const player of state.players) {
      expect(player.tiles.hand).toHaveLength(rule.initialHandCount);
    }
  });

  it('配牌後の牌山枚数が正しい', () => {
    const state = initializeGame(createInitialState(rule));
    const totalTiles = rule.tiles.reduce((sum, t) => sum + t.count, 0);
    const dealtTiles = rule.initialHandCount * rule.players.length;
    expect(state.wall.tiles).toHaveLength(totalTiles - dealtTiles);
  });
});

describe('drawToHand / discardTile', () => {
  it('ツモった牌が手牌に追加される', () => {
    let state = shuffleWall(createInitialState(rule));
    const before = state.wall.tiles.length;
    state = drawToHand(state, 'p1', 'head');
    expect(state.players[0].tiles.hand).toHaveLength(1);
    expect(state.wall.tiles).toHaveLength(before - 1);
  });

  it('捨てた牌が手牌から河に移動する', () => {
    let state = shuffleWall(createInitialState(rule));
    state = drawToHand(state, 'p1', 'head');
    const instanceId = state.players[0].tiles.hand[0].tile.instanceId;
    state = discardTile(state, 'p1', instanceId);
    expect(state.players[0].tiles.hand).toHaveLength(0);
    expect(state.players[0].tiles.river).toHaveLength(1);
    expect(state.players[0].tiles.river[0].faceUp).toBe(true);
  });
});

describe('transferScore', () => {
  it('プレイヤー間で点数が移動する', () => {
    const state = createInitialState(rule);
    const next = transferScore(state, 'p1', 'p2', 'points', 8000);
    expect(next.players[0].score.points).toBe(17000);
    expect(next.players[1].score.points).toBe(33000);
  });

  it('供託への点数移動が正しい', () => {
    const state = createInitialState(rule);
    const next = transferScore(state, 'p1', 'supply', 'points', 1000);
    expect(next.players[0].score.points).toBe(24000);
    expect(next.supply.points).toBe(1000);
  });
});
