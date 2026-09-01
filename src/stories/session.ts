import { fn } from 'storybook/test'
import { useSession, type SessionStore } from '@/composables/shared/session/useSession'
import { isComplete } from '@/core/session'
import type { Backup, ImportParseResult } from '@/storage/backup'
import type { SessionRepo } from '@/storage/sessionRepo'
import type { Exercise, Menu, Session } from '@/core/types'

/**
 * fixture の startedAt をローカル日付から作る（月は 1 始まりで渡す）。
 * 日付表示・並び順を見る stories は CI の TZ に依存させないためこれを使う。
 * 時刻の既定は 9 時。同日内の前後関係が要る stories だけ hour を渡す。
 */
export function localStartedAt(year: number, month: number, date: number, hour = 9): number {
  return new Date(year, month - 1, date, hour, 0).getTime()
}

/**
 * 実 DB へ書かない fake repo を作る（stories の loaders / provide decorator から使う）。
 * stories は表示状態だけ欲しいので、書き込み系はすべて握りつぶす。
 * 読み取り系は sessions（保存済みセッションの fixture 群）から実 repo と同じ規則で導出する
 * （get = id 一致、latestByExercise = 同種目の直近、latestCompleteBefore = 同種目・完遂・
 * startedAt がより前の直近、list = startedAt 降順）。
 */
export function makeSessionRepo(sessions: Session[] = []): SessionRepo {
  const byStartedAt = [...sessions].sort((a, b) => a.startedAt - b.startedAt)
  return {
    insert: async () => {},
    patchResults: async () => {},
    remove: async () => {},
    get: async (id) => sessions.find((session) => session.id === id),
    list: async () => [...byStartedAt].reverse(),
    latestByExercise: async (exercise) =>
      byStartedAt.filter((session) => session.exercise === exercise).at(-1),
    latestCompleteBefore: async (exercise, startedAt) =>
      byStartedAt
        .filter(
          (session) =>
            session.exercise === exercise && isComplete(session) && session.startedAt < startedAt,
        )
        .at(-1),
  }
}

/**
 * 実 DB へ書かない fake の Export / Import 口（stories の loaders / provide decorator から使う）。
 * 呼び出しは fn で記録し、play 関数から配線を assert できるようにする。
 * 検証は実装（backup.parseImport）ではなく引数の parsed をそのまま返し、
 * stories 側が成功 / 失敗の分岐を決められるようにする（検証そのものは backup.spec が担う）。
 */
export function makeBackup(parsed: ImportParseResult = { ok: true, sessions: [] }): Backup {
  return {
    createExport: fn(async () => ({ fileName: 'peak-rm-export-2026-05-12.json', json: '{}' })),
    // 入力を無視して parsed を返す（成功 / 失敗の分岐は stories 側が決める）。
    // parseImport は引数を使わないが、宣言しなくても fn が実引数を記録するので、
    // play 関数は渡された本文を toHaveBeenCalledWith で assert できる
    parseImport: fn(() => parsed),
    // 実 replaceAll は Dexie へ渡すため、構造化複製の制約を fake にも課す
    // （設定画面が pendingSessions を shallowRef で持つ前提が壊れれば DataCloneError で落ちる）
    replaceAll: fn(async (sessions: Session[]) => {
      structuredClone(sessions)
    }),
  }
}

/**
 * 表示確認用の最小 Session fixture。weight と各セットの実績回数（actualReps）が
 * そのまま 1RM / 前回記録の表示を決める。
 * menu.reps には先頭セットの実績が入る。全セットの実績を先頭セット以上（例: [8, 8, 8]）に
 * すると完遂となり linear progression のトリガーとしても使える。届かないセットがあれば未完遂。
 * id / startedAt の既定は種目名 / 0。複数 fixture の並存や日付表示が要る stories だけ上書きする。
 * menu の reps / sets も上書きでき、目標未達（実績 < reps）や未実施セットあり
 * （results.length < sets = 中断）といった状態を実績と独立に作れる。
 */
export function makeSession(
  exercise: Exercise,
  weight: number,
  actualReps: number[],
  {
    id = exercise,
    startedAt = 0,
    reps = actualReps[0] ?? 0,
    sets = actualReps.length,
  }: { id?: string; startedAt?: number; reps?: number; sets?: number } = {},
): Session {
  return {
    id,
    exercise,
    startedAt,
    menu: { exercise, weight, reps, sets, intervalSec: 90 },
    results: actualReps.map((actual) => ({ actualReps: actual, memo: '' })),
  }
}

/**
 * Storybook 用に useSession を実際に駆動して途中状態の store を作る（stories の loaders から使う）。
 * completedReps を先頭から completeSet で積み、phase: 'setActive' なら続けて nextSet で
 * 次セット実行中へ進める（training 画面用。interval 画面はインターバル中のまま渡す）。
 * completedReps を省略すると開始直後（setActive・DB 未書き込み）の store になる。
 * この store のセッションを読まない画面（履歴経由の結果確認画面）へ渡す用途。
 * 終端済みの store が要る画面は completedReps を積んだうえで呼び出し側が leave() する。
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
