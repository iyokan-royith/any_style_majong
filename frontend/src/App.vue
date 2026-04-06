<script setup lang="ts">
import { ref } from 'vue';
import {
  createInitialState,
  initializeGame,
  drawToHand,
  discardTile,
  transferScore,
  revealWallTile,
  type GameState,
  type HandTile,
} from '@any-style-mahjong/game-core';
import { createStandardRule } from '@any-style-mahjong/game-core';

const rule = createStandardRule();
const state = ref<GameState>(createInitialState(rule));

function initialize() {
  state.value = initializeGame(createInitialState(rule));
}

function draw(playerId: string) {
  state.value = drawToHand(state.value, playerId, 'head');
}

function discard(playerId: string, instanceId: string) {
  state.value = discardTile(state.value, playerId, instanceId);
}

function revealWall(index: number) {
  state.value = revealWallTile(state.value, index);
}

const transferForm = ref({ from: 'p1', to: 'p2', unit: 'points', amount: 1000 });
function doTransfer() {
  const { from, to, unit, amount } = transferForm.value;
  state.value = transferScore(state.value, from, to, unit, amount);
}

function tileLabel(definitionId: string): string {
  return rule.tiles.find(t => t.id === definitionId)?.label ?? definitionId;
}

function handTileClass(ht: HandTile): string {
  return [ht.tile.faceUp ? 'face-up' : 'face-down', ht.sideways ? 'sideways' : ''].join(' ');
}
</script>

<template>
  <div class="app">
    <h1>Any Style Mahjong — デバッグUI</h1>

    <!-- コントロール -->
    <section class="panel">
      <h2>操作</h2>
      <button @click="initialize">ゲーム初期化</button>
    </section>

    <!-- 点数移動 -->
    <section class="panel">
      <h2>点数移動</h2>
      <div class="transfer-form">
        <select v-model="transferForm.from">
          <option v-for="p in rule.players" :key="p.id" :value="p.id">{{ p.name }}</option>
          <option value="supply">供託</option>
        </select>
        <span> → </span>
        <select v-model="transferForm.to">
          <option v-for="p in rule.players" :key="p.id" :value="p.id">{{ p.name }}</option>
          <option value="supply">供託</option>
        </select>
        <input v-model.number="transferForm.amount" type="number" min="1" style="width: 80px" />
        <span>点</span>
        <button @click="doTransfer">移動</button>
      </div>
      <div class="scores">
        <span v-for="p in state.players" :key="p.id" class="score-badge">
          {{ p.name }}: {{ p.score.points?.toLocaleString() }}点
        </span>
        <span class="score-badge">供託: {{ state.supply.points?.toLocaleString() }}点</span>
      </div>
    </section>

    <!-- 牌山 -->
    <section class="panel">
      <h2>牌山（{{ state.wall.tiles.length }}枚）</h2>
      <div class="wall">
        <span
          v-for="(tile, i) in state.wall.tiles"
          :key="tile.instanceId"
          class="tile"
          :class="tile.faceUp ? 'face-up' : 'face-down'"
          @click="revealWall(i)"
          :title="`[${i}] クリックで公開`"
        >
          {{ tile.faceUp ? tileLabel(tile.definitionId) : '■' }}
        </span>
      </div>
    </section>

    <!-- プレイヤー -->
    <section v-for="player in state.players" :key="player.id" class="panel player-panel">
      <h2>
        {{ player.name }}
        <span class="score">{{ player.score.points?.toLocaleString() }}点</span>
        <button @click="draw(player.id)" :disabled="state.wall.tiles.length === 0">ツモ</button>
      </h2>

      <div class="hand-label">手牌</div>
      <div class="hand">
        <span
          v-for="ht in player.tiles.hand"
          :key="ht.tile.instanceId"
          class="tile"
          :class="handTileClass(ht)"
          @click="discard(player.id, ht.tile.instanceId)"
          title="クリックで捨牌"
        >
          {{ ht.tile.faceUp ? tileLabel(ht.tile.definitionId) : '🀫' }}
        </span>
        <span v-if="player.tiles.hand.length === 0" class="empty">（なし）</span>
      </div>

      <div class="hand-label">河</div>
      <div class="river">
        <span
          v-for="tile in player.tiles.river"
          :key="tile.instanceId"
          class="tile face-up"
        >
          {{ tileLabel(tile.definitionId) }}
        </span>
        <span v-if="player.tiles.river.length === 0" class="empty">（なし）</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
h1 { color: #f0c040; margin-bottom: 16px; }
h2 { margin: 0 0 8px; font-size: 1em; color: #aaa; }

.panel {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.player-panel { border-left: 3px solid #4a6; }

button {
  background: #4a6;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
}
button:disabled { background: #555; cursor: not-allowed; }
button:hover:not(:disabled) { background: #5b8; }

.tile {
  display: inline-block;
  padding: 2px 4px;
  margin: 2px;
  border-radius: 3px;
  font-size: 0.85em;
  cursor: pointer;
  user-select: none;
}
.tile.face-up { background: #f5f0e0; color: #222; }
.tile.face-down { background: #446; color: #aaa; }
.tile.sideways { transform: rotate(90deg); margin: 4px 8px; }

.wall { display: flex; flex-wrap: wrap; gap: 2px; max-height: 120px; overflow-y: auto; }
.hand, .river { display: flex; flex-wrap: wrap; align-items: center; min-height: 32px; }
.hand-label { font-size: 0.75em; color: #888; margin-top: 6px; }
.empty { color: #555; font-size: 0.8em; }

.scores { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.score-badge { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; }
.score { margin-left: 8px; font-weight: normal; color: #8cf; }

.transfer-form { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
select, input { background: #333; color: #eee; border: 1px solid #555; padding: 3px 6px; border-radius: 4px; }
</style>
