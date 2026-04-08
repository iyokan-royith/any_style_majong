<template>
  <div class="game-view">
    <!-- 左: 卓上 + 基本動作 -->
    <div class="table-area">
      <GameTable :state="state" @discard="onDiscard" @reveal="onRevealWall" />

      <div class="action-bar">
        <div class="action-row">
          <button @click="onDraw">ツモ <kbd>Space</kbd></button>
          <div class="action-gap" />
          <button @click="toggleMode">
            モード: {{ discardMode ? '捨てる' : '開ける' }}
          </button>
          <button @click="onRevealHand">手牌を開ける</button>
        </div>
        <div v-if="state.rule.declarations.length > 0" class="action-row">
          <button
            v-for="decl in state.rule.declarations"
            :key="decl.id"
            class="btn-declaration"
            @click="onDeclare(decl.id)"
          >{{ decl.label }}</button>
        </div>
      </div>
    </div>

    <!-- 右: 情報エリア -->
    <div class="info-area">

      <!-- ── 卓の状態 (global) ── -->
      <section v-if="globalDefs.length > 0" class="info-section">
        <h3>卓の状態</h3>
        <div v-for="def in globalDefs" :key="def.id" class="state-row">
          <span class="state-label">{{ def.label }}</span>

          <!-- list: クリックで次の値にサイクル -->
          <button
            v-if="def.globalType !== 'integer'"
            class="btn-sm btn-toggle"
            @click="cycleGlobal(def.id, def.values ?? [])"
          >{{ state.tableState.global[def.id] ?? '—' }}</button>

          <!-- integer: 値 + 増減ボタン -->
          <template v-else>
            <button class="btn-sm btn-step" @click="stepGlobal(def.id, -1)">－</button>
            <span class="state-value int-value">{{ state.tableState.global[def.id] ?? '0' }}</span>
            <button class="btn-sm btn-step" @click="stepGlobal(def.id, +1)">＋</button>
          </template>
        </div>
      </section>

      <!-- ── exclusive 状態 (1人に付与) ── -->
      <section v-for="def in exclusiveDefs" :key="def.id" class="info-section">
        <h3>{{ def.label }}</h3>
        <div v-for="player in state.players" :key="player.id" class="exclusive-row">
          <span
            :class="['exclusive-name', { active: state.tableState.exclusive[def.id] === player.id }]"
          >{{ player.name }}</span>
          <button
            class="btn-sm"
            :disabled="state.tableState.exclusive[def.id] === player.id"
            @click="onSetExclusive(def.id, player.id)"
          >付与</button>
        </div>
      </section>

      <!-- ── プレイヤー ── -->
      <section class="info-section">
        <h3>プレイヤー</h3>
        <div v-for="player in state.players" :key="player.id" class="player-row">
          <span class="player-name">{{ player.name }}</span>
          <span class="player-score">
            <template v-for="(val, unit) in player.score" :key="unit">
              {{ unit }}: {{ val }}
            </template>
          </span>
          <!-- per-player 状態 -->
          <div v-for="def in perPlayerDefs" :key="def.id" class="perplayer-row">
            <span class="state-label">{{ def.label }}</span>

            <!-- list: クリックで次の値にサイクル -->
            <button
              v-if="def.perPlayerType !== 'toggle'"
              class="btn-sm btn-toggle"
              @click="cyclePerPlayer(def.id, player.id, def.values ?? [])"
            >{{ state.tableState.perPlayer[def.id]?.[player.id] ?? '—' }}</button>

            <!-- toggle: on/off ボタン -->
            <button
              v-else
              :class="['btn-sm', 'btn-toggle-onoff', { active: state.tableState.perPlayer[def.id]?.[player.id] === 'on' }]"
              @click="togglePerPlayer(def.id, player.id)"
            >{{ state.tableState.perPlayer[def.id]?.[player.id] === 'on' ? 'ON' : 'OFF' }}</button>
          </div>
        </div>
      </section>

      <!-- ── 供託 ── -->
      <section class="info-section">
        <h3>供託</h3>
        <div v-for="(val, unit) in state.supply" :key="unit" class="info-row">
          <span class="info-label">{{ unit }}</span>
          <span class="info-value">{{ val }}</span>
        </div>
      </section>

      <!-- ── 山 ── -->
      <section class="info-section">
        <h3>山</h3>
        <div class="info-row">
          <span class="info-label">残り</span>
          <span class="info-value">{{ remaining }} 枚</span>
        </div>
      </section>

      <!-- ── リセット ── -->
      <section class="info-section">
        <button class="btn-reset-game" @click="resetGame">卓をリセットする</button>
      </section>

      <!-- ── ルール読み込み ── -->
      <section class="info-section rule-section">
        <h3>ルール</h3>
        <label class="file-label">
          YAMLを読み込む
          <input type="file" accept=".yaml,.yml" @change="onYamlFile" />
        </label>
        <div v-if="loadedFileName" class="file-name">{{ loadedFileName }}</div>
        <button v-if="loadedFileName" class="btn-sm btn-reset" @click="resetToStandard">標準ルールに戻す</button>
        <div v-if="yamlError" class="yaml-error">{{ yamlError }}</div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { load as yamlLoad } from 'js-yaml';
import {
  createInitialState,
  initializeGame,
  drawToHand,
  discardTile,
  revealWallTile,
  setGlobalState,
  setExclusiveState,
  setPerPlayerState,
  createStandardRule,
  wallRemaining,
} from '@any-style-mahjong/game-core';
import type { GameState } from '@any-style-mahjong/game-core';
import { parseRuleConfig } from '@any-style-mahjong/rule-loader';
import GameTable from '../components/table/GameTable.vue';

const yamlError = ref<string | null>(null);
const loadedFileName = ref<string | null>(null);

const rule = createStandardRule();
const state = ref<GameState>(initializeGame(createInitialState(rule)));

async function onYamlFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  yamlError.value = null;
  try {
    const data = yamlLoad(await file.text());
    const newRule = parseRuleConfig(data);
    loadedFileName.value = file.name;
    state.value = initializeGame(createInitialState(newRule));
  } catch (e) {
    yamlError.value = e instanceof Error ? e.message : String(e);
    (event.target as HTMLInputElement).value = '';
  }
}

function resetToStandard() {
  loadedFileName.value = null;
  yamlError.value = null;
  state.value = initializeGame(createInitialState(createStandardRule()));
}

const discardMode = ref(true);
const remaining = computed(() => wallRemaining(state.value.wall));

// ── tableStates の種別ごとに分類 ──
const globalDefs    = computed(() => state.value.rule.tableStates.filter(d => d.kind === 'global'));
const exclusiveDefs = computed(() => state.value.rule.tableStates.filter(d => d.kind === 'exclusive'));
const perPlayerDefs = computed(() => state.value.rule.tableStates.filter(d => d.kind === 'per-player'));

// ── アクション ──
function onDraw() {
  if (state.value.players.length === 0) return;
  const playerId = state.value.players[0].id;
  state.value = drawToHand(state.value, playerId, 'head');
}

function toggleMode() {
  discardMode.value = !discardMode.value;
}

function onDiscard(playerId: string, instanceId: string) {
  state.value = discardTile(state.value, playerId, instanceId);
}

function resetGame() {
  state.value = initializeGame(createInitialState(state.value.rule));
}

function onRevealWall(index: number) {
  state.value = revealWallTile(state.value, index);
}

function onRevealHand() {
  // TODO: 手牌公開アクション（skeleton）
}

function onDeclare(_declId: string) {
  // TODO: 発声アクション（skeleton）
}

/** values 配列を現在値の次にサイクルする */
function nextValue(current: string | undefined, values: string[]): string {
  const idx = current !== undefined ? values.indexOf(current) : -1;
  return values[(idx + 1) % values.length];
}

function cycleGlobal(stateId: string, values: string[]) {
  const current = state.value.tableState.global[stateId];
  state.value = setGlobalState(state.value, stateId, nextValue(current, values));
}

function stepGlobal(stateId: string, delta: number) {
  const current = parseInt(state.value.tableState.global[stateId] ?? '0', 10);
  state.value = setGlobalState(state.value, stateId, String(current + delta));
}

function onSetExclusive(stateId: string, playerId: string) {
  state.value = setExclusiveState(state.value, stateId, playerId);
}

function cyclePerPlayer(stateId: string, playerId: string, values: string[]) {
  const current = state.value.tableState.perPlayer[stateId]?.[playerId];
  state.value = setPerPlayerState(state.value, stateId, playerId, nextValue(current, values));
}

function togglePerPlayer(stateId: string, playerId: string) {
  const current = state.value.tableState.perPlayer[stateId]?.[playerId];
  state.value = setPerPlayerState(state.value, stateId, playerId, current === 'on' ? 'off' : 'on');
}
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  background: #111;
  color: #eee;
  font-family: monospace;
  overflow: hidden;
}

.table-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  min-width: 0;
}

.action-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-gap {
  width: 16px;
}

button {
  padding: 6px 14px;
  background: #2a4a2a;
  color: #eee;
  border: 1px solid #4a7a4a;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  font-size: 13px;
}
button:hover {
  background: #3a6a3a;
}
.btn-declaration {
  background: #3a3a1a;
  border-color: #7a7a3a;
}
.btn-declaration:hover {
  background: #5a5a2a;
}
kbd {
  background: #1a2a1a;
  border: 1px solid #555;
  border-radius: 2px;
  padding: 0 4px;
  font-size: 11px;
}

.info-area {
  width: 220px;
  flex-shrink: 0;
  background: #1a1a2a;
  border-left: 1px solid #333;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section h3 {
  font-size: 12px;
  color: #f0c040;
  margin: 0 0 6px;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 0;
}
.info-label { color: #999; }
.info-value  { color: #eee; }
.info-empty  { color: #555; font-size: 11px; }

.player-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  border-bottom: 1px solid #222;
  font-size: 12px;
}
.player-name  { color: #8cf; }
.player-score { color: #aaa; font-size: 11px; }

/* ── ルール読み込み ── */
.rule-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}
.file-label {
  display: inline-block;
  padding: 4px 10px;
  background: #2a3a5a;
  border: 1px solid #4a6a9a;
  border-radius: 4px;
  font-size: 11px;
  color: #adf;
  cursor: pointer;
  text-align: center;
}
.file-label:hover { background: #3a4a7a; }
.file-label input[type="file"] { display: none; }
.file-name { font-size: 10px; color: #8cf; word-break: break-all; }
.btn-reset { background: #3a2a2a; border-color: #7a4a4a; }
.btn-reset:hover { background: #5a3a3a; }
.btn-reset-game {
  width: 100%;
  background: #3a1a1a;
  border-color: #8a3a3a;
  color: #faa;
}
.btn-reset-game:hover { background: #5a2a2a; }

.yaml-error {
  font-size: 10px;
  color: #f88;
  background: #2a1a1a;
  border: 1px solid #7a3a3a;
  border-radius: 3px;
  padding: 4px 6px;
  word-break: break-all;
  white-space: pre-wrap;
}

/* ── 状態行 ── */
.state-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  font-size: 12px;
}
.state-label { color: #999; flex: 1; }
.state-value { color: #eee; min-width: 28px; text-align: right; }

/* ── exclusive ── */
.exclusive-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  font-size: 12px;
}
.exclusive-name {
  flex: 1;
  color: #999;
}
.exclusive-name.active {
  color: #f0c040;
  font-weight: bold;
}

/* ── per-player (プレイヤー行内) ── */
.perplayer-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 0;
  font-size: 11px;
}

/* ── 小ボタン ── */
.btn-sm {
  padding: 2px 8px;
  font-size: 11px;
  background: #2a3a4a;
  border-color: #4a6a8a;
  flex-shrink: 0;
}
.btn-sm:hover  { background: #3a5a7a; }
.btn-sm:disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}
.btn-toggle {
  min-width: 40px;
  text-align: center;
  background: #1e3a4a;
  border-color: #3a6a8a;
  color: #8cf;
}
.btn-toggle:hover { background: #2a5a6a; }

.btn-step {
  min-width: 24px;
  padding: 2px 4px;
  background: #2a2a3a;
  border-color: #5a5a8a;
}
.btn-step:hover { background: #3a3a5a; }

.int-value {
  min-width: 28px;
  text-align: center;
  display: inline-block;
}

.btn-toggle-onoff {
  min-width: 40px;
  text-align: center;
  background: #2a2a2a;
  border-color: #555;
  color: #888;
}
.btn-toggle-onoff:hover { background: #3a3a3a; }
.btn-toggle-onoff.active {
  background: #1a3a1a;
  border-color: #4a8a4a;
  color: #8f8;
}
</style>
