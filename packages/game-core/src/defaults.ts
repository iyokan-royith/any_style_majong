import type { RuleConfig } from './types/rule.js';

/**
 * 標準的な4人麻雀のルール設定
 * テストやデバッグ用のデフォルト値
 */
export function createStandardRule(): RuleConfig {
  const suits = [
    { prefix: 'man', label: '萬' },
    { prefix: 'pin', label: '筒' },
    { prefix: 'sou', label: '索' },
  ];

  const honors = [
    { id: 'east',  label: '東' },
    { id: 'south', label: '南' },
    { id: 'west',  label: '西' },
    { id: 'north', label: '北' },
    { id: 'haku',  label: '白' },
    { id: 'hatsu', label: '發' },
    { id: 'chun',  label: '中' },
  ];

  const redFiveIds = new Set(['man5', 'pin5', 'sou5']);

  const tiles = [
    ...suits.flatMap(s =>
      Array.from({ length: 9 }, (_, i) => {
        const id = `${s.prefix}${i + 1}`;
        return {
          id,
          label: `${i + 1}${s.label}`,
          count: 4,
          ...(redFiveIds.has(id) ? { variants: { red: 1 } } : {}),
        };
      }),
    ),
    ...honors.map(h => ({ ...h, count: 4 })),
  ];

  return {
    players: [
      { id: 'p1', name: '東家' },
      { id: 'p2', name: '南家' },
      { id: 'p3', name: '西家' },
      { id: 'p4', name: '北家' },
    ],
    tiles,
    initialHandCount: 13,
    dora: [{ positionFromBack: 5 }],
    scoreUnits: [{ id: 'points', label: '点' }],
    initialScore: { points: 25000 },
    tableStates: [
      { id: 'dealer',  label: '親',  kind: 'exclusive' },
      { id: 'round',   label: '場',  kind: 'global', globalType: 'list',    values: ['東', '南', '西', '北'] },
      { id: 'honba',   label: '本場', kind: 'global', globalType: 'integer' },
    ],
    declarations: [
      { id: 'pon',  label: 'ポン' },
      { id: 'chi',  label: 'チー' },
      { id: 'kan',  label: 'カン' },
      { id: 'ron',  label: 'ロン' },
      { id: 'tsumo', label: 'ツモ' },
      { id: 'riichi', label: 'リーチ' },
    ],
  };
}
