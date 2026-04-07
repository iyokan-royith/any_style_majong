import type { TileDefinition } from './tile.js';
import type { ScoreUnit } from './score.js';
import type { TableStateDefinition } from './table-state.js';

export interface PlayerDefinition {
  id: string;
  name: string;
}

/** 牌山の後ろから何番目かを表向きにするか */
export interface DoraConfig {
  positionFromBack: number;
}

/** 発声の定義（ロン、ポン、チー等） */
export interface DeclarationDefinition {
  id: string;
  label: string;
}

export interface RuleConfig {
  players: PlayerDefinition[];
  tiles: TileDefinition[];
  /** 最初に配る手牌枚数（各プレイヤー同じ枚数） */
  initialHandCount: number;
  dora: DoraConfig[];
  scoreUnits: ScoreUnit[];
  /** 各プレイヤーの初期点数（unitId → 値） */
  initialScore: Score;
  tableStates: TableStateDefinition[];
  declarations: DeclarationDefinition[];
}

import type { Score } from './score.js';
