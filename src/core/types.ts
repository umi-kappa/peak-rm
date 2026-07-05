export type Exercise = 'benchPress' | 'squat' | 'deadlift'

export type Menu = {
  exercise: Exercise
  weight: number // kg, 0.25 刻み
  reps: number // 回
  sets: number // セット数
  intervalSec: number // 秒, 10 刻み
}

export type SetResult = {
  actualReps: number // 0 以上の整数。0 = 実質スキップ
  memo: string // 初期値 ""・上限なし・不変性の対象外
}

export type Session = {
  id: string
  exercise: Exercise
  status: 'executed' | 'aborted'
  startedAt: number // unix ms
  menu: Readonly<Menu> // 開始時点の deep copy を焼き込み、Readonly で変更を禁止
  results: SetResult[]
}
