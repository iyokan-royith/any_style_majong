<template>
  <!-- Rectangular wall: top/bottom horizontal, left/right vertical -->
  <div class="wall-ring">
    <!-- Top side -->
    <div class="wall-side side-top">
      <div
        v-for="col in sides.top"
        :key="col.index"
        class="wall-col"
      >
        <div :class="['wall-tile', tileClass(col.index)]" />
      </div>
    </div>

    <!-- Middle row: left | inner | right -->
    <div class="wall-middle">
      <div class="wall-side side-left">
        <div
          v-for="col in sides.left"
          :key="col.index"
          class="wall-col"
        >
          <div :class="['wall-tile', tileClass(col.index)]" />
        </div>
      </div>

      <!-- Inner: discard piles and table center -->
      <div class="wall-inner">
        <slot />
      </div>

      <div class="wall-side side-right">
        <div
          v-for="col in sides.right"
          :key="col.index"
          class="wall-col"
        >
          <div :class="['wall-tile', tileClass(col.index)]" />
        </div>
      </div>
    </div>

    <!-- Bottom side -->
    <div class="wall-side side-bottom">
      <div
        v-for="col in sides.bottom"
        :key="col.index"
        class="wall-col"
      >
        <div :class="['wall-tile', tileClass(col.index)]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Wall } from '@any-style-mahjong/game-core';

const props = defineProps<{ wall: Wall }>();

/** 各ペア（偶数インデックス）をcolumnとして返す */
const columns = computed(() => {
  const pairs: { index: number }[] = [];
  for (let i = 0; i < props.wall.tiles.length; i += 2) {
    pairs.push({ index: i });
  }
  return pairs;
});

/**
 * 列を4辺に均等分配。
 * bottom (自分側) → right → top → left の順で山を積む。
 */
const sides = computed(() => {
  const cols = columns.value;
  const total = cols.length;
  const perSide = Math.ceil(total / 4);
  return {
    bottom: cols.slice(0, perSide),
    right:  cols.slice(perSide, perSide * 2),
    top:    [...cols.slice(perSide * 2, perSide * 3)].reverse(),
    left:   [...cols.slice(perSide * 3)].reverse(),
  };
});

function tileClass(pairIndex: number): string {
  const { head, tail } = props.wall;
  // 偶奇両方が null かどうかで「引かれた列」を判定
  const lo = props.wall.tiles[pairIndex];
  const hi = props.wall.tiles[pairIndex + 1];
  if (lo === null && hi === null) return 'drawn';
  if (pairIndex / 2 < head / 2 || pairIndex / 2 > tail / 2) return 'drawn';
  return 'remaining';
}
</script>

<style scoped>
.wall-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
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

/* top / bottom: tiles in a row */
.side-top,
.side-bottom {
  display: flex;
  flex-direction: row;
  gap: 1px;
  padding: 1px 0;
}

/* left / right: tiles in a column */
.side-left,
.side-right {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 1px;
}

.wall-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.wall-tile {
  width: 12px;
  height: 16px;
  border-radius: 1px;
}
.wall-tile.remaining {
  background: #c8b560;
  border: 1px solid #a89040;
}
.wall-tile.drawn {
  background: transparent;
  border: 1px dashed #444;
}
</style>
