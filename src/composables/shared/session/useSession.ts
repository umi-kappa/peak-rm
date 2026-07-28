import { computed, readonly, ref, shallowRef, toRaw, type InjectionKey } from 'vue'

import { sessionMaxOneRm } from '@/core/session'
import { sessionRepo } from '@/storage/sessionRepo'
import type { Menu, SetResult, Session } from '@/core/types'

// トレーニングフローの内部フェーズ。done は「フローが終端に達した」ことのみを表し、
// 成否は results から導出する（core/session の isComplete / 表示用の sessionOutcome）。
export type TrainingPhase = 'setActive' | 'interval' | 'done'

// 依存は sessionRepo のみ注入する。start() には menu 画面で確定済みの Menu を渡す。
// now / createId はテストで決定的にするため差し替え可能にする。
export type SessionDeps = {
  sessionRepo: Pick<typeof sessionRepo, 'insert' | 'patchResults'>
  now?: () => number
  createId?: () => string
}

/**
 * 実行中セッション 1 つの状態機械と Dexie 増分保存を束ねるヘッドレス層。
 * 計算ルール（1RM 等）は core の純関数に委ね、ここでは状態遷移と永続化の配線だけを担う。
 * main.ts が単一インスタンスを生成して router のセッションガードへ渡しつつ app.provide し、
 * training / interval / result が inject で共有する。
 * deps は通常省略し、本番の sessionRepo・実時計・実 UUID を使う。テストでのみ fake repo や固定の now / createId を渡す。
 */
export function useSession(deps: SessionDeps = { sessionRepo }) {
  const repo = deps.sessionRepo
  const now = deps.now ?? (() => Date.now())
  const createId = deps.createId ?? (() => crypto.randomUUID())

  // 実行中セッション。更新は常に新しいオブジェクトへ再代入する（イミュータブル）。
  // shallowRef にして results / menu を reactive proxy で包まないことで、
  // そのまま repo へ渡しても IndexedDB の構造化複製が proxy で失敗しない。
  const session = shallowRef<Session | undefined>()
  const phase = ref<TrainingPhase>('done')
  // setActive 中の現セットの実績回数。results には completeSet で初めて積む。
  const draftReps = ref(0)
  // completeSet の永続化 await 中の再入（二重タップ）ガード。初回セット完了は insert のため、
  // patchResults の上書きと違い並走すると同一 id の二重 insert で例外になる
  let persistingSet = false

  function start(menu: Menu) {
    if (menu.sets < 1) throw new Error(`menu.sets must be >= 1: ${menu.sets}`)
    // 開始時点のメニューを deep copy で焼き込み、Readonly で以後の変更を型レベルに封じる。
    // 呼び出し側が reactive / ref の Menu を渡しても壊れないよう toRaw で proxy を剥がす
    // （structuredClone は Vue の proxy を複製できず DataCloneError を投げるため）。
    const frozenMenu: Readonly<Menu> = structuredClone(toRaw(menu))
    // この時点では DB へ書かない。最初のセット完了（completeSet）で results 込みで insert し、
    // 1 セットも完了せず離脱した場合は何も残さない（不変条件: DB には実績のあるセッションしか存在しない）
    session.value = {
      id: createId(),
      exercise: menu.exercise,
      startedAt: now(),
      menu: frozenMenu,
      results: [],
    }
    draftReps.value = menu.reps
    phase.value = 'setActive'
  }

  async function completeSet() {
    if (persistingSet) return
    if (phase.value !== 'setActive') return
    const current = session.value
    if (current === undefined) return
    persistingSet = true
    try {
      const results = [...current.results, { actualReps: draftReps.value, memo: '' }]
      const isFirstSet = current.results.length === 0
      const isLastSet = results.length === current.menu.sets
      // 初回セット完了で初めて DB へ insert する（開始時には insert しない）。以降は results を増分 patch。
      // 完遂かどうかは results から都度導出されるため、書き込みは results のみで足りる
      if (isFirstSet) {
        await repo.insert({ ...current, results })
      } else {
        await repo.patchResults(current.id, results)
      }
      if (isLastSet) {
        session.value = { ...current, results }
        phase.value = 'done'
        return
      }
      // await 中にブラウザバック等の leave() でフローが終端していたら書き戻さない。
      // done を interval で上書きすると、離脱済みのフローへセッションガードを素通りして再入できてしまう
      if (phase.value !== 'setActive') return
      session.value = { ...current, results }
      phase.value = 'interval'
    } finally {
      persistingSet = false
    }
  }

  function nextSet() {
    if (phase.value !== 'interval') return
    draftReps.value = session.value?.menu.reps ?? 0
    phase.value = 'setActive'
  }

  function abort() {
    // 中断はインターバル中のみ（spec: 中断ボタンはインターバル画面にのみ配置。setActive には置かない）。
    // nextSet / completeSet と対称にガードする
    if (phase.value !== 'interval') return
    // インターバル中 = 1 セット以上完了済みで、results は completeSet が都度保存しているため
    // 追加書き込みは不要
    phase.value = 'done'
  }

  function leave() {
    // セッションフロー（training / interval / result）からの離脱でフローを終端させる
    //（spec「セッションフローからの離脱」）。ブラウザ / OS の戻る等どのフェーズからでも呼ばれるため
    // abort と違いガードせず無条件に確定する。完了済みセットは completeSet が都度保存しており、
    // 1 セットも完了していなければ DB 未書き込みのまま破棄されるため追加の永続化は不要。
    // session データは残す（結果確認画面が離脱後も参照しうる）
    phase.value = 'done'
  }

  // 完了済みセット 1 件のフィールド（実績回数・メモ）を更新し、results 全体を再保存する
  async function patchResultAt(index: number, patch: Partial<SetResult>) {
    const current = session.value
    if (current === undefined) return
    if (index < 0 || index >= current.results.length) return
    const results = current.results.map((r, i) => (i === index ? { ...r, ...patch } : r))
    await repo.patchResults(current.id, results)
    session.value = { ...current, results }
  }

  function editCurrentReps(value: number) {
    draftReps.value = value
  }

  return {
    session: readonly(session),
    phase: readonly(phase),
    currentReps: readonly(draftReps),
    menu: computed(() => session.value?.menu),
    exercise: computed(() => session.value?.exercise),
    // 次に記録するセットの 0 始まりインデックス（= 完了済みセット数）
    currentSetIndex: computed(() => session.value?.results.length ?? 0),
    setsTotal: computed(() => session.value?.menu.sets ?? 0),
    maxOneRm: computed(() => (session.value ? sessionMaxOneRm(session.value) : 0)),
    start,
    completeSet,
    nextSet,
    abort,
    leave,
    patchResultAt,
    editCurrentReps,
  }
}

export type SessionStore = ReturnType<typeof useSession>

export const sessionInjectionKey: InjectionKey<SessionStore> = Symbol('session')
