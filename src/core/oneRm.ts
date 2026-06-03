import type { Exercise } from '@/core/types'

/**
 * FWJ 換算式で 1RM 相当値を推定する。
 * 有効レンジは 1〜12 reps。超過入力も受け付ける（精度低下は許容し上限バリデーションは入れない）。
 * reps < 1（スキップ＝実績 0 回）は 1RM 計算から除外し 0 を返す。
 */
export function estimateOneRm(exercise: Exercise, weight: number, reps: number): number {
  if (reps < 1) return 0
  switch (exercise) {
    case 'benchPress':
      return weight * (1 + reps / 40)
    case 'squat':
    case 'deadlift':
      return weight * (1 + reps / 33.3)
    default: {
      const _exhaustive: never = exercise
      throw new Error(`Unknown exercise: ${_exhaustive}`)
    }
  }
}
