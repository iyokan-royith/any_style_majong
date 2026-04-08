<template>
  <div :class="['player-area', `pos-${position}`, { empty: !player }]">
    <template v-if="player">
      <div class="player-name">{{ player.name }}</div>
      <div class="hand">
        <div
          v-for="ht in player.tiles.hand"
          :key="ht.tile.instanceId"
          :class="['tile', { sideways: ht.sideways, 'face-up': visible(ht.tile.faceUp), 'face-down': !visible(ht.tile.faceUp) }]"
          @click="emit('discard', ht.tile.instanceId)"
        >
          {{ visible(ht.tile.faceUp) ? tileLabel(ht.tile.definitionId) : '' }}
        </div>
      </div>
    </template>
    <template v-else>
      <div class="empty-seat">（空席）</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Player, TileDefinition } from '@any-style-mahjong/game-core';

const props = defineProps<{
  player: Player | null;
  position: 'top' | 'bottom' | 'left' | 'right';
  tileDefs: TileDefinition[];
  /** true のとき、裏牌も表向きとして表示する（自分の手牌用） */
  showFaceUp?: boolean;
}>();

function tileLabel(definitionId: string): string {
  return props.tileDefs.find(d => d.id === definitionId)?.label ?? definitionId;
}

const emit = defineEmits<{
  discard: [instanceId: string];
}>();

function visible(faceUp: boolean): boolean {
  return props.showFaceUp === true || faceUp;
}
</script>

<style scoped>
.player-area {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* bottom: self — horizontal, name above hand */
.pos-bottom {
  flex-direction: column;
  justify-content: flex-end;
}
.pos-bottom .hand {
  display: flex;
  flex-direction: row;
  gap: 2px;
}

/* top: opponent — horizontal, rotated 180° */
.pos-top {
  flex-direction: column;
  justify-content: flex-start;
  transform: rotate(180deg);
}
.pos-top .hand {
  display: flex;
  flex-direction: row;
  gap: 2px;
}

/* left: rotated 90° clockwise */
.pos-left {
  flex-direction: column;
  justify-content: center;
  transform: rotate(90deg);
}
.pos-left .hand {
  display: flex;
  flex-direction: row;
  gap: 2px;
}

/* right: rotated 90° counter-clockwise */
.pos-right {
  flex-direction: column;
  justify-content: center;
  transform: rotate(-90deg);
}
.pos-right .hand {
  display: flex;
  flex-direction: row;
  gap: 2px;
}

.player-name {
  font-size: 11px;
  color: #aaa;
  text-align: center;
  white-space: nowrap;
}

.tile {
  width: 22px;
  height: 30px;
  border: 1px solid #666;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-family: monospace;
  cursor: pointer;
}
.tile.face-up {
  background: #f5f0e0;
  color: #222;
}
.tile.face-down {
  background: #3a5a3a;
  color: transparent;
}
.tile.sideways {
  transform: rotate(90deg);
  margin: 4px 0;
}

.empty-seat {
  color: #555;
  font-size: 11px;
  text-align: center;
}
</style>
