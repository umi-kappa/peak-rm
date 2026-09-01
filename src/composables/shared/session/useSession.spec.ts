import { reactive } from 'vue'
import { describe, expect, test } from 'vitest'

import {
  useSession,
  type SessionDeps,
  type SessionStore,
} from '@/composables/shared/session/useSession'
import { isComplete } from '@/core/session'
import type { Menu, SetResult, Session } from '@/core/types'

// fake sessionRepo が記録する呼び出し履歴。永続化タイミングの検証に使う。
type RepoCall =
  | { method: 'insert'; session: Session }
  | { method: 'patchResults'; id: string; results: SetResult[] }

// 記録の前に structuredClone を通し、実 Dexie と同じ構造化複製の制約を fake にも課す。
// session を deep proxy で包む退行（shallowRef → ref）が入れば、実 DB と同じく DataCloneError で落ちる
function createFakeRepo() {
  const calls: RepoCall[] = []
  return {
    calls,
    insert: async (session: Session) => {
      calls.push({ method: 'insert', session: structuredClone(session) })
    },
    patchResults: async (id: string, results: SetResult[]) => {
      calls.push({ method: 'patchResults', id, results: structuredClone(results) })
    },
  }
}

function menu(overrides: Partial<Menu> = {}): Menu {
  return { exercise: 'benchPress', weight: 100, reps: 8, sets: 3, intervalSec: 90, ...overrides }
}

// 固定の now / createId を注入し、startedAt・id を決定的にする。
function setup() {
  const repo = createFakeRepo()
  const deps: SessionDeps = { sessionRepo: repo, now: () => 1000, createId: () => 'sess-1' }
  return { repo, session: useSession(deps) }
}

// 完遂かどうかは results から都度導出する（判定は core の isComplete に委ねる）
function completed(store: SessionStore): boolean {
  const current = store.session.value
  return current !== undefined && isComplete(current)
}

describe('useSession', () => {
  test('start は DB へ書き込まず、メモリ上に実績空の Session を構築する', () => {
    const { repo, session } = setup()
    session.start(menu())
    expect(repo.calls).toHaveLength(0)
    expect(session.session.value).toMatchObject({
      id: 'sess-1',
      exercise: 'benchPress',
      startedAt: 1000,
      results: [],
    })
    expect(session.phase.value).toBe('setActive')
    expect(session.currentReps.value).toBe(8)
  })

  test('最初のセット完了で results 込みの Session を insert し interval へ進む', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    expect(session.phase.value).toBe('interval')
    expect(repo.calls).toHaveLength(1)
    expect(repo.calls.at(0)).toMatchObject({
      method: 'insert',
      session: {
        id: 'sess-1',
        results: [{ actualReps: 8, memo: '' }],
      },
    })
  })

  test('2 セット目以降の完了は results を patchResults する', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    session.nextSet()
    await session.completeSet()
    // 1 セット = 1 書き込み（初回セットの insert と中間セットの patchResults の 2 回だけ）
    expect(repo.calls).toHaveLength(2)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      id: 'sess-1',
      results: [
        { actualReps: 8, memo: '' },
        { actualReps: 8, memo: '' },
      ],
    })
  })

  test('最終セットを目標達成で完了すると patchResults で全 results を保存し、完遂・done になる', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2, reps: 8 }))
    await session.completeSet()
    session.nextSet()
    await session.completeSet()
    // 初回セットの insert と最終セットの patchResults の 2 回だけ（確定用の追加書き込みは無い）
    expect(repo.calls).toHaveLength(2)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      id: 'sess-1',
      results: [
        { actualReps: 8, memo: '' },
        { actualReps: 8, memo: '' },
      ],
    })
    expect(completed(session)).toBe(true)
    expect(session.phase.value).toBe('done')
  })

  test('最終セットが目標未達なら未完遂のまま done になる', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2, reps: 8 }))
    await session.completeSet()
    session.nextSet()
    session.editCurrentReps(5)
    await session.completeSet()
    // 初回セットの insert と最終セットの patchResults の 2 回だけ（確定用の追加書き込みは無い）
    expect(repo.calls).toHaveLength(2)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      id: 'sess-1',
      results: [
        { actualReps: 8, memo: '' },
        { actualReps: 5, memo: '' },
      ],
    })
    expect(completed(session)).toBe(false)
    expect(session.phase.value).toBe('done')
  })

  test('sets=1 の完遂は初回完了 = 最終セット完了で、insert 1 回だけで確定する', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 1, reps: 8 }))
    await session.completeSet()
    expect(repo.calls).toHaveLength(1)
    expect(repo.calls.at(0)).toMatchObject({
      method: 'insert',
      session: { results: [{ actualReps: 8, memo: '' }] },
    })
    expect(completed(session)).toBe(true)
    expect(session.phase.value).toBe('done')
  })

  test('sets=1 の目標未達も insert 1 回で確定し、未完遂のまま done になる', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 1, reps: 8 }))
    session.editCurrentReps(5)
    await session.completeSet()
    expect(repo.calls).toHaveLength(1)
    expect(repo.calls.at(0)).toMatchObject({
      method: 'insert',
      session: { results: [{ actualReps: 5, memo: '' }] },
    })
    expect(completed(session)).toBe(false)
    expect(session.phase.value).toBe('done')
  })

  test('abort は追加の永続化をせず done にする（完了済みセットは都度保存済み）', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    const callsBefore = repo.calls.length
    session.abort()
    expect(session.phase.value).toBe('done')
    expect(repo.calls).toHaveLength(callsBefore)
  })

  test('start は sets < 1 のメニューを拒否する', () => {
    const { repo, session } = setup()
    expect(() => session.start(menu({ sets: 0 }))).toThrow()
    expect(repo.calls).toHaveLength(0)
    expect(session.session.value).toBeUndefined()
  })

  test('abort は setActive（インターバル外）では何もしない', () => {
    const { session } = setup()
    session.start(menu())
    session.abort()
    expect(session.phase.value).toBe('setActive')
  })

  test('1 セットも完了せず leave すると DB には何も書かれない（実績のないセッションを残さない）', () => {
    const { repo, session } = setup()
    session.start(menu())
    session.leave()
    expect(session.phase.value).toBe('done')
    expect(repo.calls).toHaveLength(0)
  })

  test('leave は interval からも done にし、session データは残す', async () => {
    const { session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    session.leave()
    expect(session.phase.value).toBe('done')
    expect(session.session.value?.results).toHaveLength(1)
  })

  test('leave は done では何も変えない（冪等）', () => {
    const { repo, session } = setup()
    session.leave()
    expect(session.phase.value).toBe('done')
    expect(repo.calls).toHaveLength(0)
  })

  test('discard は interval 中のセッションを session データごと捨てて done にする（追加の永続化はしない）', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    const callsBefore = repo.calls.length
    session.discard()
    expect(session.phase.value).toBe('done')
    expect(session.session.value).toBeUndefined()
    expect(repo.calls).toHaveLength(callsBefore)
  })

  test('discard は leave が残した session データも捨てる（Import 確定の経路）', async () => {
    const { session } = setup()
    session.start(menu({ sets: 3 }))
    await session.completeSet()
    session.leave()
    session.discard()
    expect(session.session.value).toBeUndefined()
  })

  test('completeSet の await 中に leave が割り込んでも done を interval で上書きしない', async () => {
    const repo = createFakeRepo()
    // 初回セット完了の insert を手動解決にして、永続化 I/O 中の離脱
    //（ブラウザバック → afterEach → leave）を再現する
    let releaseInsert!: () => void
    const blockedRepo = {
      ...repo,
      insert: (session: Session) =>
        new Promise<void>((resolve) => {
          releaseInsert = () => {
            repo.calls.push({ method: 'insert', session: structuredClone(session) })
            resolve()
          }
        }),
    }
    const session = useSession({
      sessionRepo: blockedRepo,
      now: () => 1000,
      createId: () => 'sess-1',
    })
    session.start(menu({ sets: 3 }))
    const completing = session.completeSet()
    session.leave()
    releaseInsert()
    await completing
    expect(session.phase.value).toBe('done')
    // フロー終端後は session も書き戻さない（結果は DB 側には保存済み）
    expect(session.session.value?.results).toHaveLength(0)
  })

  test('completeSet の二重呼び出し（二重タップ）でも同一セットを重複記録しない', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 3 }))
    // await せず並走させる。2 回目は永続化中の再入ガードで即 return し、
    // 初回セット完了の insert が同一 id で二重実行されない
    await Promise.all([session.completeSet(), session.completeSet()])
    expect(repo.calls).toHaveLength(1)
    expect(repo.calls.at(0)).toMatchObject({ method: 'insert' })
    expect(session.session.value?.results).toHaveLength(1)
    expect(session.phase.value).toBe('interval')
  })

  test('開始後に元の Menu を書き換えても Session.menu は変わらない（deep copy）', () => {
    const { session } = setup()
    const original = menu({ weight: 100 })
    session.start(original)
    original.weight = 999
    expect(session.session.value?.menu.weight).toBe(100)
  })

  test('reactive な Menu を渡しても structuredClone が壊れず開始できる', () => {
    const { session } = setup()
    // メニュー画面のフォーム状態は reactive proxy になりうる。toRaw で剥がせていないと
    // structuredClone が DataCloneError を投げて start が throw する
    session.start(reactive(menu({ weight: 100 })))
    expect(session.session.value?.menu.weight).toBe(100)
    expect(session.phase.value).toBe('setActive')
  })

  test('フェーズは setActive → interval → setActive → … → done と遷移する', async () => {
    const { session } = setup()
    session.start(menu({ sets: 2, reps: 8 }))
    expect(session.phase.value).toBe('setActive')
    await session.completeSet()
    expect(session.phase.value).toBe('interval')
    session.nextSet()
    expect(session.phase.value).toBe('setActive')
    expect(session.currentReps.value).toBe(8)
    await session.completeSet()
    expect(session.phase.value).toBe('done')
  })

  test('patchResultAt は完了済みセットの実績を更新し patchResults する', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2 }))
    await session.completeSet()
    await session.patchResultAt(0, { actualReps: 3 })
    expect(session.session.value?.results.at(0)?.actualReps).toBe(3)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      results: [{ actualReps: 3, memo: '' }],
    })
  })

  test('patchResultAt はメモだけの更新もでき patchResults する', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2 }))
    await session.completeSet()
    await session.patchResultAt(0, { memo: 'フォームを意識した' })
    expect(session.session.value?.results.at(0)?.memo).toBe('フォームを意識した')
    expect(repo.calls.at(-1)).toMatchObject({ method: 'patchResults' })
  })

  test('patchResultAt は実績とメモを 1 回の patchResults で同時更新する', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2 }))
    await session.completeSet()
    const callsBefore = repo.calls.length
    await session.patchResultAt(0, { actualReps: 5, memo: '4回目からフォームが乱れた' })
    expect(session.session.value?.results.at(0)).toEqual({
      actualReps: 5,
      memo: '4回目からフォームが乱れた',
    })
    expect(repo.calls).toHaveLength(callsBefore + 1)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      results: [{ actualReps: 5, memo: '4回目からフォームが乱れた' }],
    })
  })

  test('patchResultAt による実績編集は完遂判定を反転させ、目標達成へ戻すと復帰する', async () => {
    const { session } = setup()
    session.start(menu({ sets: 1, reps: 8 }))
    await session.completeSet()
    expect(completed(session)).toBe(true)

    await session.patchResultAt(0, { actualReps: 5 })
    expect(completed(session)).toBe(false)

    await session.patchResultAt(0, { actualReps: 8 })
    expect(completed(session)).toBe(true)
  })

  test('patchResultAt は範囲外 index では何もせず永続化もしない', async () => {
    const { repo, session } = setup()
    session.start(menu({ sets: 2 }))
    await session.completeSet()
    const callsBefore = repo.calls.length
    await session.patchResultAt(5, { actualReps: 3 })
    expect(repo.calls).toHaveLength(callsBefore)
    expect(session.session.value?.results).toHaveLength(1)
  })

  test('editCurrentReps は現セットの実績のみ変え、永続化しない', () => {
    const { repo, session } = setup()
    session.start(menu())
    const callsBefore = repo.calls.length
    session.editCurrentReps(5)
    expect(session.currentReps.value).toBe(5)
    expect(repo.calls).toHaveLength(callsBefore)
  })

  test('maxOneRm は start 前は 0', () => {
    const { session } = setup()
    expect(session.maxOneRm.value).toBe(0)
  })

  test('maxOneRm は実績 0 回（skip）を除外し実施セットの最大値を返す', async () => {
    const { session } = setup()
    // benchPress 100kg・8 回 → 100×(1+8/40)=120。skip（実績 0 回）は 1RM 計算から除外する
    session.start(menu({ exercise: 'benchPress', weight: 100, reps: 8, sets: 2 }))
    await session.completeSet() // set1: 実績 8
    session.nextSet()
    session.editCurrentReps(0) // set2: skip
    await session.completeSet()
    expect(session.maxOneRm.value).toBe(120)
  })

  test('nextSet は interval 以外（setActive）では何もしない', () => {
    const { session } = setup()
    session.start(menu())
    session.nextSet()
    expect(session.phase.value).toBe('setActive')
  })

  test('start 前は completeSet / patchResultAt を呼んでも永続化せず状態も変えない', async () => {
    const { repo, session } = setup()
    await session.completeSet()
    await session.patchResultAt(0, { actualReps: 5 })
    expect(repo.calls).toHaveLength(0)
    expect(session.session.value).toBeUndefined()
    expect(session.phase.value).toBe('done')
  })
})
