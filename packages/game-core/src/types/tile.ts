/** ルールで定義された牌の種類 */
export interface TileDefinition {
  id: string;
  label: string;
  count: number;
}

/** ゲーム中の牌インスタンス */
export interface Tile {
  instanceId: string;
  definitionId: string;
  faceUp: boolean;
}
