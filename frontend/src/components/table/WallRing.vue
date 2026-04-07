<template>
  <!--
    牌山を矩形4辺に並べる。
    消費順：bottom(左→右) → right(下→上) → top(右→左) → left(上→下)
    つまり head=0 が bottom 左端、tail=最後 が left 下端。

    portrait (上下辺): 手牌と同サイズ 22×30。上に上段牌、下に下段牌を縦積み。
    landscape (左右辺): 横長 30×22。内側（卓中央寄り）が上段牌、外側が下段牌。
  -->
  <div class="wall-ring">
    <!-- 上辺 -->
    <div class="wall-side side-top">
      <div v-for="col in sides.top" :key="col" class="wall-pair pair-portrait">
        <div :class="['wt', 'wt-portrait', tileStatus(col + 1)]" />
        <div :class="['wt', 'wt-portrait', tileStatus(col)]" />
      </div>
    </div>

    <div class="wall-middle">
      <!-- 左辺: 各行 = [outer(下段)|inner(上段)] の横並び、上から下へ -->
      <div class="wall-side side-left">
        <div v-for="col in sides.left" :key="col" class="wall-pair pair-landscape">
          <div :class="['wt', 'wt-landscape', tileStatus(col)]" />
          <div :class="['wt', 'wt-landscape', tileStatus(col + 1)]" />
        </div>
      </div>

      <div class="wall-inner"><slot /></div>

      <!-- 右辺: 各行 = [inner(上段)|outer(下段)] の横並び、上から下へ -->
      <div class="wall-side side-right">
        <div v-for="col in sides.right" :key="col" class="wall-pair pair-landscape">
          <div :class="['wt', 'wt-landscape', tileStatus(col + 1)]" />
          <div :class="['wt', 'wt-landscape', tileStatus(col)]" />
        </div>
      </div>
    </div>

    <!-- 下辺 -->
    <div class="wall-side side-bottom">
      <div v-for="col in sides.bottom" :key="col" class="wall-pair pair-portrait">
        <div :class="['wt', 'wt-portrait', tileStatus(col + 1)]" />
        <div :class="['wt', 'wt-portrait', tileStatus(col)]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Wall } from '@any-style-mahjong/game-core';

const props = defineProps<{ wall: Wall }>();

/**
 * ペア(列)の偶数インデックス一覧を返す。
 * tiles[i]=下段、tiles[i+1]=上段。
 */
const pairIndices = computed((): number[] => {
  const result: number[] = [];
  for (let i = 0; i < props.wall.tiles.length; i += 2) result.push(i);
  return result;
});

/**
 * 消費順に4辺へ均等分配（bottom→right→top→left の時計回り逆方向）。
 *
 * 表示上の並びは各辺の「視覚的始端」に合わせて調整:
 *   bottom : 0..N-1 → 左から右 (そのまま)
 *   right  : N..2N-1 → 下から上 (逆順表示: 2N-1..N)
 *   top    : 2N..3N-1 → 右から左 (逆順表示: 3N-1..2N)
 *   left   : 3N..end  → 上から下 (そのまま)
 */
const sides = computed(() => {
  const p = pairIndices.value;
  const n = Math.ceil(p.length / 4);
  return {
    bottom: p.slice(0, n),
    right:  [...p.slice(n, n * 2)].reverse(),
    top:    [...p.slice(n * 2, n * 3)].reverse(),
    left:   p.slice(n * 3),
  };
});

/**
 * 個別タイルスロットの状態。
 *  remaining  : 残っている（明るい）
 *  drawn      : 引かれた（暗く輪郭のみ）
 *  upper-drawn: 上段のみ引かれた（暗い）— 上段スロットを下段が残っているときに区別
 */
function tileStatus(index: number): 'remaining' | 'drawn' {
  const { head, tail, tiles } = props.wall;
  if (index >= tiles.length) return 'drawn';
  if (index < head || index > tail) return 'drawn';
  if (tiles[index] === null) return 'drawn';
  return 'remaining';
}
</script>

<style scoped>
/* ── 全体レイアウト ────────────────────────── */
.wall-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wall-middle {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
}

.wall-inner {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

/* 上下辺: ペアを横に並べる */
.side-top,
.side-bottom {
  display: flex;
  flex-direction: row;
  gap: 1px;
}

/* 左右辺: ペアを縦に並べる */
.side-left,
.side-right {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* ── ペア（列） ───────────────────────────── */
/* portrait: 上段を上、下段を下に縦積み */
.pair-portrait {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* landscape: 2枚を横に並べる */
.pair-landscape {
  display: flex;
  flex-direction: row;
  gap: 0;
}

/* ── タイル本体 ───────────────────────────── */
.wt {
  border-radius: 2px;
  flex-shrink: 0;
}

/* 縦長（上下辺）: 手牌と同サイズ */
.wt-portrait {
  width: 22px;
  height: 30px;
}

/* 横長（左右辺）: 手牌を90°回転したサイズ */
.wt-landscape {
  width: 30px;
  height: 22px;
}

/* 残っている牌 */
.wt.remaining {
  background: #c8b560;
  border: 1px solid #a89040;
}

/* 引かれた牌スロット（空の凹み） */
.wt.drawn {
  background: #1a1a1a;
  border: 1px solid #333;
}
</style>
