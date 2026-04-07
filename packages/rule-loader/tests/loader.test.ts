import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load as yamlLoad } from 'js-yaml';
import { parseRuleConfig } from '../src/index.js';
import { createStandardRule, createInitialState, initializeGame, wallRemaining } from '@any-style-mahjong/game-core';

const baseRule = {
  players: [
    { id: 'p1', name: '東家' },
    { id: 'p2', name: '南家' },
    { id: 'p3', name: '西家' },
    { id: 'p4', name: '北家' },
  ],
  tiles: {
    suits: [
      { prefix: 'man', label: '萬', range: [1, 9], count: 4 },
    ],
    honors: [
      { id: 'east', label: '東', count: 4 },
    ],
  },
  initialHandCount: 13,
  scoreUnits: [{ id: 'points', label: '点' }],
  initialScore: { points: 25000 },
};

describe('parseRuleConfig', () => {
  it('range でスートを展開する', () => {
    const rule = parseRuleConfig(baseRule);
    const manTiles = rule.tiles.filter(t => t.id.startsWith('man'));
    expect(manTiles).toHaveLength(9);
    expect(manTiles[0]).toMatchObject({ id: 'man1', label: '1萬', count: 4 });
    expect(manTiles[8]).toMatchObject({ id: 'man9', label: '9萬', count: 4 });
  });

  it('honors をそのまま TileDefinition に変換する', () => {
    const rule = parseRuleConfig(baseRule);
    const east = rule.tiles.find(t => t.id === 'east');
    expect(east).toMatchObject({ id: 'east', label: '東', count: 4 });
  });

  it('numbers で飛び飛びのスートを定義できる（3人麻雀）', () => {
    const rule = parseRuleConfig({
      ...baseRule,
      tiles: {
        suits: [{ prefix: 'man', label: '萬', numbers: [1, 9], count: 4 }],
        honors: [],
      },
    });
    const manTiles = rule.tiles.filter(t => t.id.startsWith('man'));
    expect(manTiles).toHaveLength(2);
    expect(manTiles.map(t => t.id)).toEqual(['man1', 'man9']);
  });

  it('tiles で特定の数字の count を上書きできる', () => {
    const rule = parseRuleConfig({
      ...baseRule,
      tiles: {
        suits: [{
          prefix: 'man', label: '萬', range: [1, 9], count: 4,
          tiles: { 5: { count: 6 } },
        }],
        honors: [],
      },
    });
    const man5 = rule.tiles.find(t => t.id === 'man5');
    expect(man5?.count).toBe(6);
    const man4 = rule.tiles.find(t => t.id === 'man4');
    expect(man4?.count).toBe(4);
  });

  it('tiles で variants を設定できる', () => {
    const rule = parseRuleConfig({
      ...baseRule,
      tiles: {
        suits: [{
          prefix: 'man', label: '萬', range: [1, 9], count: 4,
          tiles: { 5: { variants: { red: 1 } } },
        }],
        honors: [],
      },
    });
    const man5 = rule.tiles.find(t => t.id === 'man5');
    expect(man5?.variants).toEqual({ red: 1 });
    const man4 = rule.tiles.find(t => t.id === 'man4');
    expect(man4?.variants).toBeUndefined();
  });

  it('honors に variants を設定できる', () => {
    const rule = parseRuleConfig({
      ...baseRule,
      tiles: {
        suits: [],
        honors: [{ id: 'north', label: '北', count: 7, variants: { gold: 2, silver: 2, rainbow: 1 } }],
      },
    });
    const north = rule.tiles.find(t => t.id === 'north');
    expect(north?.variants).toEqual({ gold: 2, silver: 2, rainbow: 1 });
  });

  it('range と numbers を両方指定するとエラー', () => {
    expect(() =>
      parseRuleConfig({
        ...baseRule,
        tiles: {
          suits: [{ prefix: 'man', label: '萬', range: [1, 9], numbers: [1, 5, 9], count: 4 }],
          honors: [],
        },
      })
    ).toThrow('ルール設定の検証に失敗しました');
  });

  it('range も numbers もないとエラー', () => {
    expect(() =>
      parseRuleConfig({
        ...baseRule,
        tiles: {
          suits: [{ prefix: 'man', label: '萬', count: 4 }],
          honors: [],
        },
      })
    ).toThrow('ルール設定の検証に失敗しました');
  });

  it('players が1人だとエラー', () => {
    expect(() =>
      parseRuleConfig({ ...baseRule, players: [{ id: 'p1', name: '東家' }] })
    ).toThrow('ルール設定の検証に失敗しました');
  });
});

describe('examples/standard.yaml', () => {
  const text = readFileSync(new URL('../examples/standard.yaml', import.meta.url), 'utf8');
  const rule = parseRuleConfig(yamlLoad(text));
  const standard = createStandardRule();

  it('牌の総数が一致する', () => {
    expect(rule.tiles.length).toBe(standard.tiles.length);
  });

  it('各牌の id・label・count・variants が一致する', () => {
    for (const expected of standard.tiles) {
      const actual = rule.tiles.find(t => t.id === expected.id);
      expect(actual, `牌 ${expected.id} が見つからない`).toBeDefined();
      expect(actual).toMatchObject(expected);
    }
  });

  it('プレイヤー・初期点数・配牌枚数が一致する', () => {
    expect(rule.players).toEqual(standard.players);
    expect(rule.initialHandCount).toBe(standard.initialHandCount);
    expect(rule.initialScore).toEqual(standard.initialScore);
    expect(rule.scoreUnits).toEqual(standard.scoreUnits);
  });

  it('卓状態・発声が一致する', () => {
    expect(rule.tableStates).toEqual(standard.tableStates);
    expect(rule.declarations).toEqual(standard.declarations);
  });
});

describe('examples/goga_roku.yaml', () => {
  const text = readFileSync(new URL('../examples/goga_roku.yaml', import.meta.url), 'utf8');

  it('エラーなく読み込める', () => {
    expect(() => parseRuleConfig(yamlLoad(text))).not.toThrow();
  });

  it('dora.positionFromBack が正しく読み込まれる', () => {
    const rule = parseRuleConfig(yamlLoad(text));
    expect(rule.dora).toHaveLength(1);
    expect(rule.dora[0].positionFromBack).toBe(7);
  });

  it('ゲーム初期化後に tail から 7 枚目の牌が表になっている', () => {
    const rule = parseRuleConfig(yamlLoad(text));
    const state = initializeGame(createInitialState(rule));
    const doraIndex = state.wall.tail - (7 - 1);
    const doraTile = state.wall.tiles[doraIndex];
    expect(doraTile).not.toBeNull();
    expect(doraTile!.faceUp).toBe(true);
    // その他の牌は裏のまま
    const remaining = wallRemaining(state.wall);
    const faceUpCount = state.wall.tiles
      .slice(state.wall.head, state.wall.tail + 1)
      .filter(t => t !== null && t.faceUp).length;
    expect(faceUpCount).toBe(rule.dora.length);
    expect(remaining).toBeGreaterThan(0);
  });
});
