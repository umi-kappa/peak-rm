import type { Exercise } from '@/core/types'

// 種目の表示ラベル。satisfies Record<Exercise> が種目追加時に網羅を強制する
export const EXERCISE_LABELS = {
  benchPress: 'BENCH PRESS',
  squat: 'SQUAT',
  deadlift: 'DEADLIFT',
} as const satisfies Record<Exercise, string>

// 表示順は EXERCISE_LABELS のキー定義順から導出（ベンチ → スクワット → デッドリフト）
export const EXERCISE_ORDER: readonly Exercise[] = Object.keys(EXERCISE_LABELS) as Exercise[]

// route param など外部由来の文字列を Exercise へ絞り込む
export function isExercise(value: string): value is Exercise {
  return (EXERCISE_ORDER as readonly string[]).includes(value)
}
