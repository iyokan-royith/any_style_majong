import { z } from 'zod';

const TileOverrideSchema = z.object({
  count: z.number().int().positive().optional(),
  variants: z.record(z.string(), z.number().int().positive()).optional(),
});

const SuitEntrySchema = z.object({
  prefix: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().positive(),
  range: z.tuple([z.number().int().min(1), z.number().int().min(1)]).optional(),
  numbers: z.array(z.number().int().positive()).min(1).optional(),
  tiles: z.record(z.string(), TileOverrideSchema).optional(),
}).refine(
  d => (d.range !== undefined) !== (d.numbers !== undefined),
  { message: '"range" か "numbers" のどちらか一方が必要です' },
);

const HonorEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().positive(),
  variants: z.record(z.string(), z.number().int().positive()).optional(),
});

const TilesSchema = z.object({
  suits: z.array(SuitEntrySchema).optional().default([]),
  honors: z.array(HonorEntrySchema).optional().default([]),
});

const PlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

const DoraConfigSchema = z.object({
  positionFromBack: z.number().int().positive(),
});

const ScoreUnitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

const TableStateDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['exclusive', 'per-player', 'global']),
  globalType: z.enum(['list', 'integer']).optional(),
  perPlayerType: z.enum(['list', 'toggle']).optional(),
  values: z.array(z.string()).optional(),
});

const DeclarationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const RuleConfigYamlSchema = z.object({
  players: z.array(PlayerSchema).min(2),
  tiles: TilesSchema,
  initialHandCount: z.number().int().positive(),
  dora: z.array(DoraConfigSchema).optional().default([]),
  scoreUnits: z.array(ScoreUnitSchema).min(1),
  initialScore: z.record(z.string(), z.number()),
  tableStates: z.array(TableStateDefinitionSchema).optional().default([]),
  declarations: z.array(DeclarationSchema).optional().default([]),
});

export type RuleConfigYaml = z.infer<typeof RuleConfigYamlSchema>;
