<script setup lang="ts">
import { ref, computed } from 'vue';
import { load as yamlLoad } from 'js-yaml';
import {
  createInitialState,
  initializeGame,
  drawToHand,
  discardTile,
  transferScore,
  revealWallTile,
  setPerPlayerState,
  wallRemaining,
  createStandardRule,
  type GameState,
  type HandTile,
  type RuleConfig,
} from '@any-style-mahjong/game-core';
import { parseRuleConfig } from '@any-style-mahjong/rule-loader';

const currentRule = ref<RuleConfig>(createStandardRule());
const state = ref<GameState>(createInitialState(currentRule.value));
const yamlError = ref<string | null>(null);
const loadedFileName = ref<string | null>(null);
const showRuleDetail = ref(false);

function initialize() {
  state.value = initializeGame(createInitialState(currentRule.value));
}

function resetToStandard() {
  currentRule.value = createStandardRule();
  loadedFileName.value = null;
  yamlError.value = null;
  state.value = createInitialState(currentRule.value);
}

async function onYamlFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  yamlError.value = null;
  try {
    const text = await file.text();
    const data = yamlLoad(text);
    const rule = parseRuleConfig(data);
    currentRule.value = rule;
    loadedFileName.value = file.name;
    state.value = createInitialState(rule);
  } catch (e) {
    yamlError.value = e instanceof Error ? e.message : String(e);
    // ファイル選択をリセットして再選択できるようにする
    (event.target as HTMLInputElement).value = '';
  }
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

const transferForm = ref({ from: '', to: '', unit: '', amount: 1000 });

function syncTransferForm() {
  const rule = currentRule.value;
  transferForm.value.from = rule.players[0]?.id ?? '';
  transferForm.value.to = rule.players[1]?.id ?? '';
  transferForm.value.unit = rule.scoreUnits[0]?.id ?? '';
}
syncTransferForm();

function doTransfer() {
  const { from, to, unit, amount } = transferForm.value;
  state.value = transferScore(state.value, from, to, unit, amount);
}

const perPlayerDefs = computed(() =>
  state.value.rule.tableStates.filter(d => d.kind === 'per-player'),
);

function cyclePerPlayer(stateId: string, playerId: string, values: string[]) {
  const current = state.value.tableState.perPlayer[stateId]?.[playerId];
  const idx = current !== undefined ? values.indexOf(current) : -1;
  const next = values[(idx + 1) % values.length];
  state.value = setPerPlayerState(state.value, stateId, playerId, next);
}

function tileLabel(definitionId: string): string {
  return state.value.rule.tiles.find(t => t.id === definitionId)?.label ?? definitionId;
}

function handTileClass(ht: HandTile): string {
  return [ht.tile.faceUp ? 'face-up' : 'face-down', ht.sideways ? 'sideways' : ''].join(' ');
}

/** 牌山を「下段(偶数index) + 上段(奇数index)」のペアに変換 */
const wallColumns = computed(() => {
  const tiles = state.value.wall.tiles;
  const cols = [];
  for (let i = 0; i < tiles.length; i += 2) {
    cols.push({
      bottom: { tile: tiles[i],     index: i },
      top:    { tile: tiles[i + 1], index: i + 1 },
    });
  }
  return cols;
});
</script>

<template>
  <div class="app">
    <h1>Any Style Mahjong — デバッグUI</h1>

    <!-- ルール設定 -->
    <section class="panel">
      <h2>ルール設定</h2>
      <div class="rule-row">
        <label class="file-label">
          YAMLを読み込む
          <input type="file" accept=".yaml,.yml" @change="onYamlFile" />
        </label>
        <span v-if="loadedFileName" class="file-name">{{ loadedFileName }}</span>
        <button v-if="loadedFileName" @click="resetToStandard" class="btn-secondary">標準ルールに戻す</button>
      </div>
      <div v-if="yamlError" class="error-box">
        <strong>読み込みエラー</strong>
        <pre>{{ yamlError }}</pre>
      </div>
      <div class="rule-summary">
        牌: {{ state.rule.tiles.length }}種 /
        プレイヤー: {{ state.rule.players.length }}人 /
        配牌: {{ state.rule.initialHandCount }}枚
        <button class="btn-secondary btn-small" @click="showRuleDetail = !showRuleDetail">
          {{ showRuleDetail ? '詳細を隠す' : '詳細を表示' }}
        </button>
      </div>

      <div v-if="showRuleDetail" class="rule-detail">

        <!-- プレイヤー -->
        <div class="detail-row">
          <span class="detail-label">プレイヤー</span>
          <span v-for="p in state.rule.players" :key="p.id" class="detail-badge">
            {{ p.name }} <small class="muted">({{ p.id }})</small>
          </span>
        </div>

        <!-- 配牌・ドラ -->
        <div class="detail-row">
          <span class="detail-label">配牌</span>
          <span class="detail-badge">{{ state.rule.initialHandCount }}枚</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ドラ</span>
          <span v-if="state.rule.dora.length === 0" class="muted">なし</span>
          <span v-for="(d, i) in state.rule.dora" :key="i" class="detail-badge">
            後ろから{{ d.positionFromBack }}枚目
          </span>
        </div>

        <!-- 点数 -->
        <div class="detail-row">
          <span class="detail-label">点数単位</span>
          <span v-for="u in state.rule.scoreUnits" :key="u.id" class="detail-badge">
            {{ u.label }}
            <small class="muted">（初期: {{ state.rule.initialScore[u.id]?.toLocaleString() }}）</small>
          </span>
        </div>

        <!-- 牌 -->
        <div class="detail-row detail-row--top">
          <span class="detail-label">牌</span>
          <div class="tile-defs">
            <span v-for="t in state.rule.tiles" :key="t.id" class="detail-badge" :title="t.id">
              {{ t.label }}×{{ t.count }}
              <template v-if="t.variants">
                <span v-for="(n, v) in t.variants" :key="v" class="variant-note">{{ v }}×{{ n }}</span>
              </template>
            </span>
          </div>
        </div>

        <!-- 卓状態 -->
        <div class="detail-row">
          <span class="detail-label">卓状態</span>
          <span v-if="state.rule.tableStates.length === 0" class="muted">なし</span>
          <span v-for="s in state.rule.tableStates" :key="s.id" class="detail-badge">
            {{ s.label }}
            <small class="muted">
              [{{ s.kind }}]
              <template v-if="s.values">{{ s.values.join(' / ') }}</template>
            </small>
          </span>
        </div>

        <!-- 発声 -->
        <div class="detail-row">
          <span class="detail-label">発声</span>
          <span v-if="state.rule.declarations.length === 0" class="muted">なし</span>
          <span v-for="d in state.rule.declarations" :key="d.id" class="detail-badge">{{ d.label }}</span>
        </div>

      </div>
    </section>

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
          <option v-for="p in state.rule.players" :key="p.id" :value="p.id">{{ p.name }}</option>
          <option value="supply">供託</option>
        </select>
        <span> → </span>
        <select v-model="transferForm.to">
          <option v-for="p in state.rule.players" :key="p.id" :value="p.id">{{ p.name }}</option>
          <option value="supply">供託</option>
        </select>
        <select v-model="transferForm.unit">
          <option v-for="u in state.rule.scoreUnits" :key="u.id" :value="u.id">{{ u.label }}</option>
        </select>
        <input v-model.number="transferForm.amount" type="number" min="1" style="width: 80px" />
        <button @click="doTransfer">移動</button>
      </div>
      <div class="scores">
        <template v-for="p in state.players" :key="p.id">
          <span class="score-badge">
            {{ p.name }}:
            <span v-for="u in state.rule.scoreUnits" :key="u.id">
              {{ p.score[u.id]?.toLocaleString() }}{{ u.label }}
            </span>
          </span>
        </template>
        <span class="score-badge">
          供託:
          <span v-for="u in state.rule.scoreUnits" :key="u.id">
            {{ state.supply[u.id]?.toLocaleString() }}{{ u.label }}
          </span>
        </span>
      </div>
    </section>

    <!-- 牌山 -->
    <section class="panel">
      <h2>牌山（{{ wallRemaining(state.wall) }}枚）</h2>
      <div class="wall-2d">
        <!-- 上段（奇数インデックス） -->
        <div class="wall-row">
          <template v-for="col in wallColumns" :key="col.top.index">
            <span
              v-if="col.top.tile !== null"
              class="wall-tile"
              :class="[
                col.top.tile.faceUp ? 'face-up' : 'face-down',
                col.top.tile.faceUp && col.top.tile.variant ? `variant-${col.top.tile.variant}` : '',
              ]"
              @click="revealWall(col.top.index)"
              :title="`[${col.top.index}] 上段 クリックで公開`"
            >{{ col.top.tile.faceUp ? tileLabel(col.top.tile.definitionId) : '■' }}</span>
            <span v-else class="wall-tile wall-tile--gone" :title="`[${col.top.index}] ツモ済`"></span>
          </template>
        </div>
        <!-- 下段（偶数インデックス） -->
        <div class="wall-row">
          <template v-for="col in wallColumns" :key="col.bottom.index">
            <span
              v-if="col.bottom.tile !== null"
              class="wall-tile"
              :class="[
                col.bottom.tile.faceUp ? 'face-up' : 'face-down',
                col.bottom.tile.faceUp && col.bottom.tile.variant ? `variant-${col.bottom.tile.variant}` : '',
              ]"
              @click="revealWall(col.bottom.index)"
              :title="`[${col.bottom.index}] 下段 クリックで公開`"
            >{{ col.bottom.tile.faceUp ? tileLabel(col.bottom.tile.definitionId) : '■' }}</span>
            <span v-else class="wall-tile wall-tile--gone" :title="`[${col.bottom.index}] ツモ済`"></span>
          </template>
        </div>
      </div>
    </section>

    <!-- プレイヤー -->
    <section v-for="player in state.players" :key="player.id" class="panel player-panel">
      <h2>
        {{ player.name }}
        <span class="score">
          <span v-for="u in state.rule.scoreUnits" :key="u.id">
            {{ player.score[u.id]?.toLocaleString() }}{{ u.label }}
          </span>
        </span>
        <button @click="draw(player.id)" :disabled="wallRemaining(state.wall) === 0">ツモ</button>
      </h2>

      <!-- per-player 状態 -->
      <div v-if="perPlayerDefs.length > 0" class="perplayer-states">
        <span
          v-for="def in perPlayerDefs"
          :key="def.id"
          class="perplayer-state"
        >
          {{ def.label }}:
          <button
            v-if="def.values && def.values.length"
            class="btn-toggle-small"
            @click="cyclePerPlayer(def.id, player.id, def.values!)"
          >{{ state.tableState.perPlayer[def.id]?.[player.id] ?? '—' }}</button>
          <span v-else class="muted">{{ state.tableState.perPlayer[def.id]?.[player.id] ?? '—' }}</span>
        </span>
      </div>

      <div class="hand-label">手牌</div>
      <div class="hand">
        <span
          v-for="ht in player.tiles.hand"
          :key="ht.tile.instanceId"
          class="tile"
          :class="[handTileClass(ht), ht.tile.faceUp && ht.tile.variant ? `variant-${ht.tile.variant}` : '']"
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
          :class="tile.variant ? `variant-${tile.variant}` : ''"
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

.wall-2d { overflow-x: auto; display: inline-block; max-width: 100%; }
.wall-row { display: flex; gap: 1px; margin-bottom: 1px; }
.wall-row:first-child { margin-bottom: 0; }
.wall-tile {
  display: inline-block;
  width: 26px;
  text-align: center;
  padding: 2px 0;
  border-radius: 2px;
  font-size: 0.8em;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.wall-tile.face-up { background: #f5f0e0; color: #222; }
.wall-tile.face-down { background: #446; color: #aaa; }
.wall-tile.variant-red { background: #f88; color: #600; }
.wall-tile--gone { background: transparent; border: 1px dashed #2a2a2a; cursor: default; }
.hand, .river { display: flex; flex-wrap: wrap; align-items: center; min-height: 32px; }
.hand-label { font-size: 0.75em; color: #888; margin-top: 6px; }
.empty { color: #555; font-size: 0.8em; }

.scores { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.score-badge { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; }
.score { margin-left: 8px; font-weight: normal; color: #8cf; }

.transfer-form { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
select, input { background: #333; color: #eee; border: 1px solid #555; padding: 3px 6px; border-radius: 4px; }

.rule-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.file-label {
  background: #446;
  color: #cdf;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.file-label input[type="file"] { display: none; }
.file-label:hover { background: #558; }
.file-name { font-size: 0.85em; color: #8cf; }
.btn-secondary { background: #555; }
.btn-secondary:hover { background: #666; }

.rule-summary { margin-top: 8px; font-size: 0.8em; color: #888; }

.btn-small { padding: 1px 6px; font-size: 0.85em; margin-left: 10px; }

.rule-detail {
  margin-top: 10px;
  border-top: 1px solid #3a3a3a;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.82em;
}
.detail-row--top { align-items: flex-start; }
.detail-label {
  color: #888;
  min-width: 64px;
  flex-shrink: 0;
}
.detail-badge {
  background: #333;
  border-radius: 3px;
  padding: 1px 6px;
  white-space: nowrap;
}
.tile-defs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.variant-note {
  margin-left: 3px;
  color: #f88;
  font-size: 0.85em;
}
.muted { color: #666; }

.error-box {
  margin-top: 8px;
  background: #422;
  border: 1px solid #844;
  border-radius: 4px;
  padding: 8px 12px;
  color: #faa;
}
.error-box pre { margin: 4px 0 0; font-size: 0.8em; white-space: pre-wrap; word-break: break-all; }

.tile.variant-red { background: #f88; color: #600; }

.perplayer-states {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  font-size: 0.82em;
  color: #aaa;
}
.perplayer-state { display: flex; align-items: center; gap: 4px; }

.btn-toggle-small {
  background: #1e3a4a;
  color: #8cf;
  border: 1px solid #3a6a8a;
  padding: 1px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9em;
}
.btn-toggle-small:hover { background: #2a5a6a; }
</style>
