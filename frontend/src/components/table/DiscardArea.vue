<template>
  <!--
    各プレイヤーの捨牌エリア。
    5行×6列 = 30スロットをあらかじめ確保し、座標を個別に計算して配置する。
    CSS rotation は使わず、各辺の向きに合わせたスクリーン座標を直接計算する。

    portrait スロット (上下辺): W=16px H=22px
    landscape スロット (左右辺): W=22px H=16px  ← 90°回転相当

    座標定義 (各辺):
      bottom: 自分の左が画面左。row 1 が卓中央寄り (grid上辺)。
      top   : 上プレイヤーの左が画面右。row 1 が卓中央寄り (grid下辺)。
      right : 右プレイヤーの左が画面下。row 1 (= 画面leftmost col) が卓中央寄り。
      left  : 左プレイヤーの左が画面上。row 1 (= 画面rightmost col) が卓中央寄り。
  -->
  <div class="discard-area">
    <div class="river river-top">
      <div
        v-for="idx in TOTAL"
        :key="idx"
        :class="['slot', 'slot-portrait', rivers.top[idx - 1] ? 'occupied' : 'empty']"
        :style="topPos(idx - 1)"
      >{{ tileLabel(rivers.top[idx - 1]) }}</div>
    </div>

    <div class="river river-left">
      <div
        v-for="idx in TOTAL"
        :key="idx"
        :class="['slot', 'slot-landscape', rivers.left[idx - 1] ? 'occupied' : 'empty']"
        :style="leftPos(idx - 1)"
      >{{ tileLabel(rivers.left[idx - 1]) }}</div>
    </div>

    <div class="center-info">
      <slot />
    </div>

    <div class="river river-right">
      <div
        v-for="idx in TOTAL"
        :key="idx"
        :class="['slot', 'slot-landscape', rivers.right[idx - 1] ? 'occupied' : 'empty']"
        :style="rightPos(idx - 1)"
      >{{ tileLabel(rivers.right[idx - 1]) }}</div>
    </div>

    <div class="river river-bottom">
      <div
        v-for="idx in TOTAL"
        :key="idx"
        :class="['slot', 'slot-portrait', rivers.bottom[idx - 1] ? 'occupied' : 'empty']"
        :style="bottomPos(idx - 1)"
      >{{ tileLabel(rivers.bottom[idx - 1]) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tile, TileDefinition } from '@any-style-mahjong/game-core';

const props = defineProps<{
  rivers: {
    top:    Tile[];
    left:   Tile[];
    right:  Tile[];
    bottom: Tile[];
  };
  tileDefs: TileDefinition[];
}>();

function tileLabel(tile: Tile | undefined): string {
  if (!tile) return '';
  return props.tileDefs.find(d => d.id === tile.definitionId)?.label ?? tile.definitionId;
}

const PER_ROW = 6; // 1行あたりの牌数
const ROWS    = 5; // 事前確保行数
const TOTAL   = PER_ROW * ROWS;

/**
 * bottom (自分): 画面左→右、画面上 (卓中央寄り) →下。
 *   playerRow 0 → gridRow 1,  playerCol 0 → gridCol 1
 */
function bottomPos(i: number) {
  return pos(Math.floor(i / PER_ROW) + 1, (i % PER_ROW) + 1);
}

/**
 * top (向い): プレイヤーの左が画面右、row 1 が画面下 (卓中央寄り)。
 *   playerRow 0 → gridRow ROWS,  playerCol 0 → gridCol PER_ROW
 */
function topPos(i: number) {
  return pos(ROWS - Math.floor(i / PER_ROW), PER_ROW - (i % PER_ROW));
}

/**
 * right (右): プレイヤーの左が画面下、row 1 が画面左 (卓中央寄り)。
 *   playerRow → screenCol (左=row1)、playerCol → screenRow (下=col0)
 *   playerRow 0 → gridCol 1,  playerCol 0 → gridRow PER_ROW
 */
function rightPos(i: number) {
  return pos(PER_ROW - (i % PER_ROW), Math.floor(i / PER_ROW) + 1);
}

/**
 * left (左): プレイヤーの左が画面上、row 1 が画面右 (卓中央寄り)。
 *   playerRow → screenCol (右=row1)、playerCol → screenRow (上=col0)
 *   playerRow 0 → gridCol ROWS,  playerCol 0 → gridRow 1
 */
function leftPos(i: number) {
  return pos((i % PER_ROW) + 1, ROWS - Math.floor(i / PER_ROW));
}

function pos(gridRow: number, gridColumn: number) {
  return { gridRow: String(gridRow), gridColumn: String(gridColumn) };
}
</script>

<style scoped>
/* ── 外枠レイアウト ──────────────────────────── */
.discard-area {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
}

.river-top    { grid-column: 2; grid-row: 1; align-self: end;    justify-self: center; }
.river-left   { grid-column: 1; grid-row: 2; align-self: center; justify-self: end;    }
.center-info  { grid-column: 2; grid-row: 2; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #ccc; }
.river-right  { grid-column: 3; grid-row: 2; align-self: center; justify-self: start;  }
.river-bottom { grid-column: 2; grid-row: 3; align-self: start;  justify-self: center; }

/* ── 各 river の内部グリッド ────────────────── */
/*
  portrait (上下): 6列×5行, 各セル 16×22px
  landscape (左右): 5列(プレイヤー行)×6行(プレイヤー列), 各セル 22×16px
*/
.river-top,
.river-bottom {
  display: grid;
  grid-template-columns: repeat(6, 16px);
  grid-template-rows: repeat(5, 22px);
  gap: 1px;
}

.river-left,
.river-right {
  display: grid;
  grid-template-columns: repeat(5, 22px);
  grid-template-rows: repeat(6, 16px);
  gap: 1px;
}

/* ── スロット ────────────────────────────────── */
.slot {
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-family: monospace;
  overflow: hidden;
}

.slot-portrait  { width: 16px; height: 22px; }
.slot-landscape { width: 22px; height: 16px; }

.slot.occupied {
  background: #d4c87a;
  border: 1px solid #a89040;
  color: #222;
}

.slot.empty {
  background: #1c2c1c;
  border: 1px solid #253525;
}
</style>
