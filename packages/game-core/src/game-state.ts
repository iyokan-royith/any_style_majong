import type { Wall } from './types/wall.js';
import type { PlayerTiles } from './types/hand.js';
import type { Score } from './types/score.js';
import type { TableState } from './types/table-state.js';
import type { RuleConfig } from './types/rule.js';

export interface Player {
  id: string;
  name: string;
  tiles: PlayerTiles;
  score: Score;
}

export interface GameState {
  rule: RuleConfig;
  wall: Wall;
  players: Player[];
  tableState: TableState;
  /** 供託（場に積み立てられた点数） */
  supply: Score;
}

export function createInitialState(rule: RuleConfig): GameState {
  const emptyScore: Score = Object.fromEntries(rule.scoreUnits.map(u => [u.id, 0]));

  return {
    rule,
    wall: { tiles: [], head: 0, tail: -1 },
    players: rule.players.map(p => ({
      id: p.id,
      name: p.name,
      tiles: { hand: [], river: [] },
      score: { ...rule.initialScore },
    })),
    tableState: {
      exclusive: {},
      perPlayer: {},
      global: {},
    },
    supply: { ...emptyScore },
  };
}
