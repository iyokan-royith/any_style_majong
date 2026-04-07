import type { GameState, Player } from './game-state.js';
import type { Tile } from './types/tile.js';
import type { HandTile } from './types/hand.js';
import { wallRemaining } from './types/wall.js';

// ── ユーティリティ ─────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function updatePlayer(state: GameState, playerId: string, update: (p: Player) => Player): GameState {
  return {
    ...state,
    players: state.players.map(p => p.id === playerId ? update(p) : p),
  };
}

function getPlayer(state: GameState, playerId: string): Player {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error(`Player not found: ${playerId}`);
  return player;
}

// ── 牌山操作 ────────────────────────────────────

/**
 * ルールに定義された全牌をシャッフルして牌山にセットする
 */
export function shuffleWall(state: GameState): GameState {
  let instanceCounter = 0;
  const allTiles: Tile[] = [];

  for (const def of state.rule.tiles) {
    const variantEntries = Object.entries(def.variants ?? {});
    const variantTotal = variantEntries.reduce((sum, [, n]) => sum + n, 0);
    const normalCount = def.count - variantTotal;

    for (let i = 0; i < normalCount; i++) {
      allTiles.push({ instanceId: `tile-${instanceCounter++}`, definitionId: def.id, faceUp: false });
    }
    for (const [variant, n] of variantEntries) {
      for (let i = 0; i < n; i++) {
        allTiles.push({ instanceId: `tile-${instanceCounter++}`, definitionId: def.id, faceUp: false, variant });
      }
    }
  }

  const shuffled = shuffle(allTiles);
  return {
    ...state,
    wall: { tiles: shuffled, head: 0, tail: shuffled.length - 1 },
    players: state.players.map(p => ({
      ...p,
      tiles: { hand: [], river: [] },
    })),
  };
}

/**
 * 牌山の先頭/末尾から1枚をプレイヤーの手牌に移動する
 */
export function drawToHand(
  state: GameState,
  playerId: string,
  from: 'head' | 'tail',
): GameState {
  if (wallRemaining(state.wall) === 0) throw new Error('Wall is empty');

  const wall = state.wall;
  const index = from === 'head' ? wall.head : wall.tail;
  const tile = wall.tiles[index]!;
  const tiles = [...wall.tiles];
  tiles[index] = null;
  const newWall = from === 'head'
    ? { ...wall, tiles, head: wall.head + 1 }
    : { ...wall, tiles, tail: wall.tail - 1 };

  const handTile: HandTile = { tile: { ...tile, faceUp: false }, sideways: false };
  return updatePlayer(
    { ...state, wall: newWall },
    playerId,
    p => ({ ...p, tiles: { ...p.tiles, hand: [...p.tiles.hand, handTile] } }),
  );
}

/**
 * 牌山の先頭/末尾から1枚をプレイヤーの河に移動する
 */
export function drawToRiver(
  state: GameState,
  playerId: string,
  from: 'head' | 'tail',
): GameState {
  if (wallRemaining(state.wall) === 0) throw new Error('Wall is empty');

  const wall = state.wall;
  const index = from === 'head' ? wall.head : wall.tail;
  const tile = wall.tiles[index]!;
  const tiles = [...wall.tiles];
  tiles[index] = null;
  const newWall = from === 'head'
    ? { ...wall, tiles, head: wall.head + 1 }
    : { ...wall, tiles, tail: wall.tail - 1 };

  const revealedTile: Tile = { ...tile, faceUp: true };
  return updatePlayer(
    { ...state, wall: newWall },
    playerId,
    p => ({ ...p, tiles: { ...p.tiles, river: [...p.tiles.river, revealedTile] } }),
  );
}

/**
 * 牌山の任意の絶対インデックスの牌を表にする
 */
export function revealWallTile(state: GameState, index: number): GameState {
  const wall = state.wall;
  if (index < 0 || index >= wall.tiles.length || wall.tiles[index] === null) {
    throw new Error(`Invalid wall index: ${index}`);
  }
  const tiles = wall.tiles.map((t, i) =>
    i === index && t !== null ? { ...t, faceUp: true } : t,
  );
  return { ...state, wall: { ...wall, tiles } };
}

// ── 手牌操作 ────────────────────────────────────

/**
 * 手牌の牌を公開する
 * @param sideways true: 横向き表示（副露牌のように）/ false: 手牌内に並べたまま表示
 */
export function revealHandTile(
  state: GameState,
  playerId: string,
  instanceId: string,
  sideways: boolean,
): GameState {
  return updatePlayer(state, playerId, p => ({
    ...p,
    tiles: {
      ...p.tiles,
      hand: p.tiles.hand.map(ht =>
        ht.tile.instanceId === instanceId
          ? { tile: { ...ht.tile, faceUp: true }, sideways }
          : ht,
      ),
    },
  }));
}

/**
 * 手牌の牌を河に捨てる
 */
export function discardTile(
  state: GameState,
  playerId: string,
  instanceId: string,
): GameState {
  const player = getPlayer(state, playerId);
  const handTile = player.tiles.hand.find(ht => ht.tile.instanceId === instanceId);
  if (!handTile) throw new Error(`Tile not in hand: ${instanceId}`);

  const discardedTile: Tile = { ...handTile.tile, faceUp: true };

  return updatePlayer(state, playerId, p => ({
    ...p,
    tiles: {
      hand: p.tiles.hand.filter(ht => ht.tile.instanceId !== instanceId),
      river: [...p.tiles.river, discardedTile],
    },
  }));
}

// ── 点数操作 ────────────────────────────────────

/**
 * 点数を移動する
 * @param fromId 移動元（playerId または 'supply'）
 * @param toId   移動先（playerId または 'supply'）
 * @param unitId 点数単位の ID
 * @param amount 移動量（正の値）
 */
export function transferScore(
  state: GameState,
  fromId: string,
  toId: string,
  unitId: string,
  amount: number,
): GameState {
  if (amount <= 0) throw new Error('Amount must be positive');

  function deduct(score: Record<string, number>): Record<string, number> {
    return { ...score, [unitId]: (score[unitId] ?? 0) - amount };
  }
  function add(score: Record<string, number>): Record<string, number> {
    return { ...score, [unitId]: (score[unitId] ?? 0) + amount };
  }

  let next = state;

  // 移動元から減算
  if (fromId === 'supply') {
    next = { ...next, supply: deduct(next.supply) };
  } else {
    next = updatePlayer(next, fromId, p => ({ ...p, score: deduct(p.score) }));
  }

  // 移動先に加算
  if (toId === 'supply') {
    next = { ...next, supply: add(next.supply) };
  } else {
    next = updatePlayer(next, toId, p => ({ ...p, score: add(p.score) }));
  }

  return next;
}

// ── 卓状態操作 ──────────────────────────────────

export function setExclusiveState(
  state: GameState,
  stateId: string,
  playerId: string,
): GameState {
  return {
    ...state,
    tableState: {
      ...state.tableState,
      exclusive: { ...state.tableState.exclusive, [stateId]: playerId },
    },
  };
}

export function setPerPlayerState(
  state: GameState,
  stateId: string,
  playerId: string,
  value: string,
): GameState {
  return {
    ...state,
    tableState: {
      ...state.tableState,
      perPlayer: {
        ...state.tableState.perPlayer,
        [stateId]: {
          ...state.tableState.perPlayer[stateId],
          [playerId]: value,
        },
      },
    },
  };
}

export function setGlobalState(
  state: GameState,
  stateId: string,
  value: string,
): GameState {
  return {
    ...state,
    tableState: {
      ...state.tableState,
      global: { ...state.tableState.global, [stateId]: value },
    },
  };
}

// ── 初期化（複合アクション）────────────────────

/**
 * ゲームを初期化する
 * 1. 全牌をシャッフルして牌山に
 * 2. 各プレイヤーに initialHandCount 枚配牌
 * 3. ドラ設定に従い牌を公開
 */
export function initializeGame(state: GameState): GameState {
  let next = shuffleWall(state);

  // 配牌
  for (let i = 0; i < state.rule.initialHandCount; i++) {
    for (const player of state.rule.players) {
      next = drawToHand(next, player.id, 'head');
    }
  }

  // ドラ公開（tail からの相対位置で計算）
  for (const dora of state.rule.dora) {
    const index = next.wall.tail - (dora.positionFromBack - 1);
    if (index >= next.wall.head && index <= next.wall.tail) {
      next = revealWallTile(next, index);
    }
  }

  return next;
}
