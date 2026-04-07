export type TableStateKind =
  | 'exclusive'   // プレイヤーの誰か1人に付与（例: 親）
  | 'per-player'  // 各プレイヤーが独立して持つ（例: 焼き鳥）
  | 'global';     // 場そのものの状態（例: 東場、本場）

export interface TableStateDefinition {
  id: string;
  label: string;
  kind: TableStateKind;
  /** per-player / global の場合の取りうる値（省略時は自由な文字列） */
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
