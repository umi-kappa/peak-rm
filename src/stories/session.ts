import { useSession, type SessionStore } from '@/composables/shared/session/useSession'
import { isExecuted } from '@/core/session'
import { dedupeHistoryByDay } from '@/core/sessionHistory'
import type { SessionRepo } from '@/storage/sessionRepo'
import type { Exercise, Menu, Session } from '@/core/types'

/**
 * 実 DB へ書かない fake repo を作る（stories の loaders / provide decorator から使う）。
 * stories は表示状態だけ欲しいので、書き込み系はすべて握りつぶす。
 * 読み取り系は sessions（保存済みセッションの fixture 群）から実 repo と同じ規則で導出する
 * （get = id 一致、latestByExercise = 同種目の直近、latestExecutedBefore = 同種目・executed・
 * startedAt がより前の直近、一覧系 = startedAt 降順 / 同日同種目の集約）。
 */
export function makeSessionRepo(sessions: Session[] = []): SessionRepo {
  const byStartedAt = [...sessions].sort((a, b) => a.startedAt - b.startedAt)
  return {
    insert: async () => {},
    patchResults: async () => {},
    patchResultsAndStatus: async () => {},
    finalize: async () => {},
    remove: async () => {},
    get: async (id) => sessions.find((session) => session.id === id),
    list: async () => [...byStartedAt].reverse(),
    listForHistory: async () => dedupeHistoryByDay(sessions),
    latestByExercise: async (exercise) =>
      byStartedAt.filter((session) => session.exercise === exercise).at(-1),
    latestExecutedBefore: async (exercise, startedAt) =>
      byStartedAt
        .filter(
          (session) =>
            session.exercise === exercise &&
            session.status === 'executed' &&
            session.startedAt < startedAt,
        )
        .at(-1),
  }
}

/**
 * 表示確認用の最小 Session fixture。weight と各セットの実績回数（actualReps）が
 * そのまま 1RM / 前回記録の表示を決める。
 * menu.reps には先頭セットの実績が入り、status は results から導出する。
 * 全セットの実績を先頭セット以上（例: [8, 8, 8]）にすると完遂（executed）となり
 * linear progression のトリガーとしても使える。届かないセットがあれば aborted。
 * id / startedAt の既定は種目名 / 0。複数 fixture の並存や日付表示が要る stories だけ上書きする。
 */
export function makeSession(
  exercise: Exercise,
  weight: number,
  actualReps: number[],
  { id = exercise, startedAt = 0 }: { id?: string; startedAt?: number } = {},
): Session {
  // status は menu / results が揃ってから isExecuted で導出する（'aborted' は仮値）
  const session: Session = {
    id,
    exercise,
    status: 'aborted',
    startedAt,
    menu: { exercise, weight, reps: actualReps[0] ?? 0, sets: actualReps.length, intervalSec: 90 },
    results: actualReps.map((reps) => ({ actualReps: reps, memo: '' })),
  }
  session.status = isExecuted(session) ? 'executed' : 'aborted'
  return session
}

/**
 * Storybook 用に useSession を実際に駆動して途中状態の store を作る（stories の loaders から使う）。
 * completedReps を先頭から completeSet で積み、phase: 'setActive' なら続けて nextSet で
 * 次セット実行中へ進める（training 画面用。interval 画面はインターバル中のまま渡す）。
 */
export async function makeSessionStore(options: {
  menu?: Partial<Menu>
  /** 完了済みセットの実績回数（先頭から順に積む） */
  completedReps?: number[]
  /** completedReps を積んだ後に到達させるフェーズ。省略時は interval のまま */
  phase?: 'setActive' | 'interval'
}): Promise<SessionStore> {
  const menu: Menu = {
    exercise: 'benchPress',
    weight: 82.5,
    reps: 8,
    sets: 3,
    intervalSec: 90,
    ...options.menu,
  }
  const store = useSession({ sessionRepo: makeSessionRepo() })
  store.start(menu)
  for (const reps of options.completedReps ?? []) {
    // completeSet 直後は interval フェーズになるため、次のセットを積む前に setActive へ戻す
    if (store.phase.value === 'interval') store.nextSet()
    store.editCurrentReps(reps)
    await store.completeSet()
  }
  if (options.phase === 'setActive') store.nextSet()
  return store
}
