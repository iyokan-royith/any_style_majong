import type { RuleConfig, TileDefinition } from '@any-style-mahjong/game-core';
import { RuleConfigYamlSchema, type RuleConfigYaml } from './schema.js';

type SuitEntry = RuleConfigYaml['tiles']['suits'][number];

function expandSuit(suit: SuitEntry): TileDefinition[] {
  const numbers = suit.range
    ? Array.from({ length: suit.range[1] - suit.range[0] + 1 }, (_, i) => suit.range![0] + i)
    : suit.numbers!;

  return numbers.map(n => {
    const override = suit.tiles?.[String(n)];
    const count = override?.count ?? suit.count;
    const def: TileDefinition = {
      id: `${suit.prefix}${n}`,
      label: `${n}${suit.label}`,
      count,
    };
    if (override?.variants) def.variants = override.variants;
    return def;
  });
}

/**
 * プレーンオブジェクト（YAMLパース済み）を受け取り、検証・変換して RuleConfig を返す
 * @throws 検証エラーの場合に詳細メッセージつきで Error を投げる
 */
export function parseRuleConfig(data: unknown): RuleConfig {
  const result = RuleConfigYamlSchema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map(i => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`ルール設定の検証に失敗しました:\n${details}`);
  }

  const yaml = result.data;

  const tiles: TileDefinition[] = [
    ...yaml.tiles.suits.flatMap(expandSuit),
    ...yaml.tiles.honors.map(h => {
      const def: TileDefinition = { id: h.id, label: h.label, count: h.count };
      if (h.variants) def.variants = h.variants;
      return def;
    }),
  ];

  return {
    players: yaml.players,
    tiles,
    initialHandCount: yaml.initialHandCount,
    dora: yaml.dora,
    scoreUnits: yaml.scoreUnits,
    initialScore: yaml.initialScore,
    tableStates: yaml.tableStates,
    declarations: yaml.declarations,
  };
}
