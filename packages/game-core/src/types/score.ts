/** 点数の単位定義（例: 点棒、チップ） */
export interface ScoreUnit {
  id: string;
  label: string;
}

/**
 * 点数（unitId → 値）
 * 例: { "points": 25000, "chips": 20 }
 */
export type Score = Record<string, number>;
