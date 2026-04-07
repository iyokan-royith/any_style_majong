<template>
  <!-- 4プレイヤー分の捨牌エリアを中央に配置 -->
  <div class="discard-area">
    <!-- 上プレイヤー捨牌（rotate 180°） -->
    <div class="river river-top">
      <div
        v-for="(tile, i) in riverOf('top')"
        :key="i"
        class="tile"
      >{{ tile.definitionId }}</div>
    </div>

    <!-- 左プレイヤー捨牌（rotate 90°） -->
    <div class="river river-left">
      <div
        v-for="(tile, i) in riverOf('left')"
        :key="i"
        class="tile"
      >{{ tile.definitionId }}</div>
    </div>

    <!-- 中央（場の状態表示スロット） -->
    <div class="center-info">
      <slot />
    </div>

    <!-- 右プレイヤー捨牌（rotate -90°） -->
    <div class="river river-right">
      <div
        v-for="(tile, i) in riverOf('right')"
        :key="i"
        class="tile"
      >{{ tile.definitionId }}</div>
    </div>

    <!-- 自分（下）の捨牌 -->
    <div class="river river-bottom">
      <div
        v-for="(tile, i) in riverOf('bottom')"
        :key="i"
        class="tile"
      >{{ tile.definitionId }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tile } from '@any-style-mahjong/game-core';

const props = defineProps<{
  rivers: {
    top:    Tile[];
    left:   Tile[];
    right:  Tile[];
    bottom: Tile[];
  };
}>();

function riverOf(pos: 'top' | 'left' | 'right' | 'bottom'): Tile[] {
  return props.rivers[pos];
}
</script>

<style scoped>
.discard-area {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  gap: 4px;
}

.river {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  max-width: 108px; /* 6 tiles × (16px + 2px gap) */
}
.river-top {
  grid-column: 2; grid-row: 1;
  transform: rotate(180deg);
  justify-content: flex-end;
}
.river-left {
  grid-column: 1; grid-row: 2;
  transform: rotate(90deg);
  flex-direction: column;
  max-width: none;
  max-height: 108px;
}
.river-right {
  grid-column: 3; grid-row: 2;
  transform: rotate(-90deg);
  flex-direction: column;
  max-width: none;
  max-height: 108px;
}
.river-bottom {
  grid-column: 2; grid-row: 3;
}
.center-info {
  grid-column: 2; grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #ccc;
}

.tile {
  width: 16px;
  height: 22px;
  background: #d4c87a;
  border: 1px solid #a89040;
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-family: monospace;
  color: #222;
}
</style>
