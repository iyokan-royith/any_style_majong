export type TableStateKind =
  | 'exclusive'   // プレイヤーの誰か1人に付与（例: 親）
  | 'per-player'  // 各プレイヤーが独立して持つ（例: 焼き鳥）
  | 'global';     // 場そのものの状態（例: 東場、本場）

/**
 * global の値の型:
 *   'list'    — values 配列から選ぶ（例: 東場/南場）
 *   'integer' — 整数値（本場数など）
 *
 * per-player の値の型:
 *   'list'   — values 配列から選ぶ
 *   'toggle' — オン/オフ二値
 */
export type GlobalValueType    = 'list' | 'integer';
export type PerPlayerValueType = 'list' | 'toggle';

export interface TableStateDefinition {
  id: string;
  label: string;
  kind: TableStateKind;
  /** global 用: 値の型 (省略時は 'list') */
  globalType?: GlobalValueType;
  /** per-player 用: 値の型 (省略時は 'list') */
  perPlayerType?: PerPlayerValueType;
  /** list 型の場合の取りうる値 */
  values?: string[];
}

export interface TableState {
  /** stateId → playerId（exclusive 用） */
  exclusive: Record<string, string>;
  /** stateId → playerId → value（per-player 用） */
  perPlayer: Record<string, Record<string, string>>;
  /** stateId → value（global 用） */
  global: Record<string, string>;
}
