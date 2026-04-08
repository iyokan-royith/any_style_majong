<template>
  <!--
    3×3 CSS グリッド:
      [.       ] [top-player ] [.      ]
      [left    ] [inner/wall  ] [right  ]
      [.       ] [bottom-self ] [.      ]
  -->
  <div class="game-table">
    <!-- 上プレイヤー -->
    <div class="cell cell-top">
      <PlayerArea
        :player="seats.top" position="top" :tile-defs="state.rule.tiles"
        @discard="id => onDiscard(seats.top, id)"
      />
    </div>

    <!-- 左プレイヤー -->
    <div class="cell cell-left">
      <PlayerArea
        :player="seats.left" position="left" :tile-defs="state.rule.tiles"
        @discard="id => onDiscard(seats.left, id)"
      />
    </div>

    <!-- 中央: 牌山リング + 捨牌 -->
    <div class="cell cell-inner">
      <WallRing :wall="state.wall" :tile-defs="state.rule.tiles" @reveal="idx => emit('reveal', idx)">
        <DiscardArea :rivers="rivers" :tile-defs="state.rule.tiles">
          <!-- 卓中央の場の状態 -->
          <div class="table-center-status">
            <div
              v-for="def in state.rule.tableStates.filter(d => d.kind === 'global')"
              :key="def.id"
              class="status-item"
            >
              {{ def.label }}: {{ state.tableState.global[def.id] ?? '—' }}
            </div>
          </div>
        </DiscardArea>
      </WallRing>
    </div>

    <!-- 右プレイヤー -->
    <div class="cell cell-right">
      <PlayerArea
        :player="seats.right" position="right" :tile-defs="state.rule.tiles"
        @discard="id => onDiscard(seats.right, id)"
      />
    </div>

    <!-- 下プレイヤー（自分）: 常に手牌を表向きで表示 -->
    <div class="cell cell-bottom">
      <PlayerArea
        :player="seats.bottom" position="bottom" :show-face-up="true" :tile-defs="state.rule.tiles"
        @discard="id => onDiscard(seats.bottom, id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState, Player } from '@any-style-mahjong/game-core';
import type { Tile } from '@any-style-mahjong/game-core';
import PlayerArea from './PlayerArea.vue';
import WallRing from './WallRing.vue';
import DiscardArea from './DiscardArea.vue';

const props = defineProps<{ state: GameState }>();

const emit = defineEmits<{
  discard: [playerId: string, instanceId: string];
  reveal:  [index: number];
}>();

function onDiscard(player: Player | null, instanceId: string) {
  if (player) emit('discard', player.id, instanceId);
}

/**
 * プレイヤーを座席に割り当てる。
 * players[0] = 自分（下）
 * 4人: 下0, 右1, 上2, 左3
 * 3人: 下0, 右1, 左2（上は空席）
 * 2人: 下0, 上1（左右は空席）
 */
const seats = computed((): { top: Player | null; left: Player | null; right: Player | null; bottom: Player | null } => {
  const p = props.state.players;
  if (p.length === 4) return { bottom: p[0], right: p[1], top: p[2], left: p[3] };
  if (p.length === 3) return { bottom: p[0], right: p[1], top: null,  left: p[2] };
  if (p.length === 2) return { bottom: p[0], right: null, top: p[1],  left: null };
  return { bottom: p[0] ?? null, right: null, top: null, left: null };
});

/** 各座席のプレイヤーの河を返す */
const rivers = computed((): { top: Tile[]; left: Tile[]; right: Tile[]; bottom: Tile[] } => {
  const r = (player: Player | null): Tile[] => player?.tiles.river ?? [];
  return {
    top:    r(seats.value.top),
    left:   r(seats.value.left),
    right:  r(seats.value.right),
    bottom: r(seats.value.bottom),
  };
});
</script>

<style scoped>
.game-table {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  grid-template-rows: 80px 1fr 80px;
  width: 100%;
  height: 100%;
  background: #1a3a1a;
  border-radius: 8px;
  overflow: hidden;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-top    { grid-column: 2; grid-row: 1; }
.cell-left   { grid-column: 1; grid-row: 2; }
.cell-inner  { grid-column: 2; grid-row: 2; padding: 8px; }
.cell-right  { grid-column: 3; grid-row: 2; }
.cell-bottom { grid-column: 2; grid-row: 3; }

.table-center-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.status-item {
  font-size: 10px;
  color: #ccc;
  white-space: nowrap;
}
</style>
