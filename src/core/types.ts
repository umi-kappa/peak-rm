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

/**
 * 読み取り専用のセッションビュー。読むだけの純関数の入力型に使う。
 * Session はそのまま代入でき、readonly()（DeepReadonly）で包まれた実行中セッションも受け取れる。
 */
export type ReadonlySession = Readonly<Omit<Session, 'results'>> & {
  readonly results: readonly Readonly<SetResult>[]
}
