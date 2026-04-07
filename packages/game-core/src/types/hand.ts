import type { Tile } from './tile.js';

/** 手牌内の牌（公開状態と表示方法を含む） */
export interface HandTile {
  tile: Tile;
  /** true: 横向き表示（副露牌のように） */
  sideways: boolean;
}

/** あるプレイヤーの手牌と河 */
export interface PlayerTiles {
  hand: HandTile[];
  /** 河（全て表向き、捨てた順に並ぶ） */
  river: Tile[];
}
