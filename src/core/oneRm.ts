import type { Exercise } from '@/core/types'

// FWJ 換算式 1RM = w × (1 + r / divisor) の種目別 divisor。
// Record<Exercise, number> により種目追加時はコンパイル時に網羅漏れを検出する。
const ONE_RM_DIVISOR: Record<Exercise, number> = {
  benchPress: 40,
  squat: 33.3,
  deadlift: 33.3,
}

/**
 * FWJ 換算式で 1RM 相当値を推定する。
 * 有効レンジは 1〜12 reps。超過入力も受け付ける（精度低下は許容し上限バリデーションは入れない）。
 * reps < 1（スキップ＝実績 0 回）は 1RM 計算から除外し 0 を返す。
 */
export function estimateOneRm(exercise: Exercise, weight: number, reps: number): number {
  if (reps < 1) return 0
  return weight * (1 + reps / ONE_RM_DIVISOR[exercise])
}
