import { computed, readonly, ref, shallowRef, toRaw, type InjectionKey } from 'vue'

import { isExecuted, sessionMaxOneRm } from '@/core/session'
import { sessionRepo } from '@/storage/sessionRepo'
import type { MenuPreset, SetResult, Session } from '@/core/types'

// トレーニングフローの内部フェーズ。Session.status（executed / aborted）とは別軸で、
// done は「フローが終端に達した」ことのみを表す（成否は Session.status が持つ）。
export type TrainingPhase = 'setActive' | 'interval' | 'done'

// 依存は sessionRepo のみ注入する。menuPresets の読み書きは menu 画面の責務で、
// start() には確定済みの MenuPreset を渡す（useSession は menuPresetRepo を参照しない）。
// now / createId はテストで決定的にするため差し替え可能にする。
export type SessionDeps = {
  sessionRepo: Pick<
    typeof sessionRepo,
    'insert' | 'patchResults' | 'patchResultsAndStatus' | 'finalize'
  >
  now?: () => number
  createId?: () => string
}

/**
 * 実行中セッション 1 つの状態機械と Dexie 増分保存を束ねるヘッドレス層。
 * 計算ルール（1RM・executed 判定）は core の純関数に委ね、ここでは状態遷移と永続化の配線だけを担う。
 * App ルートで単一インスタンスを provide し、training / interval / result が inject で共有する。
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

  async function start(menu: MenuPreset) {
    // 開始時点のメニューを deep copy で焼き込み、Readonly で以後の変更を型レベルに封じる。
    // 呼び出し側が reactive / ref の MenuPreset を渡しても壊れないよう toRaw で proxy を剥がす
    // （structuredClone は Vue の proxy を複製できず DataCloneError を投げるため）。
    const frozenMenu: Readonly<MenuPreset> = structuredClone(toRaw(menu))
    const next: Session = {
      id: createId(),
      exercise: menu.exercise,
      status: 'aborted', // 保守的デフォルト。完遂時のみ executed へ更新する
      startedAt: now(),
      menu: frozenMenu,
      results: [],
    }
    await repo.insert(next)
    session.value = next
    draftReps.value = menu.reps
    phase.value = 'setActive'
  }

  async function completeSet() {
    if (phase.value !== 'setActive') return
    const current = session.value
    if (current === undefined) return
    const results = [...current.results, { actualReps: draftReps.value, memo: '' }]
    const isLastSet = results.length === current.menu.sets
    if (!isLastSet) {
      session.value = { ...current, results }
      await repo.patchResults(current.id, results)
      phase.value = 'interval'
      return
    }
    // 最終セット完了。全セット目標達成のときだけ executed 確定、それ以外（未達含む）は aborted 据え置き
    if (isExecuted({ ...current, results })) {
      session.value = { ...current, results, status: 'executed' }
      await repo.finalize(current.id, results)
    } else {
      session.value = { ...current, results }
      await repo.patchResults(current.id, results)
    }
    phase.value = 'done'
  }

  function nextSet() {
    if (phase.value !== 'interval') return
    draftReps.value = session.value?.menu.reps ?? 0
    phase.value = 'setActive'
  }

  function abort() {
    // DB は開始時から aborted で保存済み・results も都度反映済みのため追加書き込みは不要
    phase.value = 'done'
  }

  // 完了済みセット 1 件のフィールドを更新し、results 全体を再保存する（editReps / editMemo の共通形）
  async function patchResultAt(index: number, patch: Partial<SetResult>) {
    const current = session.value
    if (current === undefined) return
    const results = current.results.map((r, i) => (i === index ? { ...r, ...patch } : r))
    // 実績編集で完遂条件の充足が変わりうるため status を再導出し、results と同時に確定する。
    // executed セッションを未達へ編集すれば aborted へ降格、その逆も追従し status×results の整合を保つ
    const status = isExecuted({ ...current, results }) ? 'executed' : 'aborted'
    session.value = { ...current, results, status }
    await repo.patchResultsAndStatus(current.id, results, status)
  }

  function editReps(index: number, value: number) {
    return patchResultAt(index, { actualReps: value })
  }

  function editCurrentReps(value: number) {
    draftReps.value = value
  }

  function editMemo(index: number, memo: string) {
    return patchResultAt(index, { memo })
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
    isExecutedNow: computed(() => (session.value ? isExecuted(session.value) : false)),
    start,
    completeSet,
    nextSet,
    abort,
    editReps,
    editCurrentReps,
    editMemo,
  }
}

export type SessionStore = ReturnType<typeof useSession>

export const sessionInjectionKey: InjectionKey<SessionStore> = Symbol('session')
