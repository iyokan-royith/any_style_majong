import type { Tile } from './tile.js';

/**
 * 牌山
 * tiles は固定長配列。ツモられた位置は null になる。
 * head/tail カーソルを進めるのみで、tiles のインデックスは変動しない。
 *
 * インデックスの偶奇で段を判定できる:
 *   index % 2 === 0 → 下段
 *   index % 2 === 1 → 上段
 *
 * 残り枚数: tail - head + 1（head > tail で空）
 */
export interface Wall {
  tiles: (Tile | null)[];
  /** 先頭側カーソル（次に通常ツモする位置） */
  head: number;
  /** 末尾側カーソル（次に嶺上牌・カンドラをとる位置） */
  tail: number;
}

/** 牌山の残り枚数を返す */
export function wallRemaining(wall: Wall): number {
  return Math.max(0, wall.tail - wall.head + 1);
}
