import type { Tile } from './tile.js';

/**
 * 牌山
 * index 0 が先頭（通常のツモ側）、末尾がカン・ドラ側
 */
export interface Wall {
  tiles: Tile[];
}
