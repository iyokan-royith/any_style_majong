/** ルールで定義された牌の種類 */
export interface TileDefinition {
  id: string;
  label: string;
  /** バリアント含む合計枚数 */
  count: number;
  /**
   * バリアントの枚数内訳（バリアントID → 枚数）
   * count からここに記載の合計を引いた枚数が通常版（variant: undefined）になる
   * 例: { red: 1 } → 赤が1枚、残りは通常版
   * 例: { gold: 2, silver: 2, rainbow: 1 } → 複数バリアントも可
   */
  variants?: Record<string, number>;
}

/** ゲーム中の牌インスタンス */
export interface Tile {
  instanceId: string;
  definitionId: string;
  faceUp: boolean;
  /** バリアント識別子（通常版は undefined） */
  variant?: string;
}
