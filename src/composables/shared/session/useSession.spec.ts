import { describe, expect, test } from 'vitest'

import { useSession, type SessionDeps } from '@/composables/shared/session/useSession'
import type { MenuPreset, SetResult, Session } from '@/core/types'

// fake sessionRepo が記録する呼び出し履歴。永続化タイミングの検証に使う。
type RepoCall =
  | { method: 'insert'; session: Session }
  | { method: 'patchResults'; id: string; results: SetResult[] }
  | { method: 'patchResultsAndStatus'; id: string; results: SetResult[]; status: Session['status'] }
  | { method: 'finalize'; id: string; results: SetResult[] }

function createFakeRepo() {
  const calls: RepoCall[] = []
  return {
    calls,
    insert: async (session: Session) => {
      calls.push({ method: 'insert', session })
    },
    patchResults: async (id: string, results: SetResult[]) => {
      calls.push({ method: 'patchResults', id, results })
    },
    patchResultsAndStatus: async (id: string, results: SetResult[], status: Session['status']) => {
      calls.push({ method: 'patchResultsAndStatus', id, results, status })
    },
    finalize: async (id: string, results: SetResult[]) => {
      calls.push({ method: 'finalize', id, results })
    },
  }
}

function menu(overrides: Partial<MenuPreset> = {}): MenuPreset {
  return { exercise: 'benchPress', weight: 100, reps: 8, sets: 3, intervalSec: 90, ...overrides }
}

// 固定の now / createId を注入し、startedAt・id を決定的にする。
function setup() {
  const repo = createFakeRepo()
  const deps: SessionDeps = { sessionRepo: repo, now: () => 1000, createId: () => 'sess-1' }
  return { repo, session: useSession(deps) }
}

describe('useSession', () => {
  test('start で status=aborted・注入した id / startedAt の Session を insert する', async () => {
    const { repo, session } = setup()
    await session.start(menu())
    expect(repo.calls).toHaveLength(1)
    expect(repo.calls.at(0)).toMatchObject({
      method: 'insert',
      session: {
        id: 'sess-1',
        exercise: 'benchPress',
        status: 'aborted',
        startedAt: 1000,
        results: [],
      },
    })
    expect(session.phase.value).toBe('setActive')
    expect(session.currentReps.value).toBe(8)
  })

  test('非最終セットの完了は results を patchResults し interval へ進む', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 3 }))
    await session.completeSet()
    expect(session.phase.value).toBe('interval')
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResults',
      id: 'sess-1',
      results: [{ actualReps: 8, memo: '' }],
    })
  })

  test('最終セットを目標達成で完了すると finalize し status=executed・done になる', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 1, reps: 8 }))
    await session.completeSet()
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'finalize',
      id: 'sess-1',
      results: [{ actualReps: 8, memo: '' }],
    })
    expect(session.session.value?.status).toBe('executed')
    expect(session.isExecutedNow.value).toBe(true)
    expect(session.phase.value).toBe('done')
  })

  test('最終セットでも目標未達なら patchResults で aborted のまま done になる', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 1, reps: 8 }))
    session.editCurrentReps(5)
    await session.completeSet()
    expect(repo.calls.at(-1)).toMatchObject({ method: 'patchResults', id: 'sess-1' })
    expect(repo.calls.some((c) => c.method === 'finalize')).toBe(false)
    expect(session.session.value?.status).toBe('aborted')
    expect(session.phase.value).toBe('done')
  })

  test('abort は追加の永続化をせず done にする（DB は既に aborted で保存済み）', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 3 }))
    await session.completeSet()
    const callsBefore = repo.calls.length
    session.abort()
    expect(session.phase.value).toBe('done')
    expect(repo.calls).toHaveLength(callsBefore)
  })

  test('開始後に元の MenuPreset を書き換えても Session.menu は変わらない（deep copy）', async () => {
    const { session } = setup()
    const original = menu({ weight: 100 })
    await session.start(original)
    original.weight = 999
    expect(session.session.value?.menu.weight).toBe(100)
  })

  test('フェーズは setActive → interval → setActive → … → done と遷移する', async () => {
    const { session } = setup()
    await session.start(menu({ sets: 2, reps: 8 }))
    expect(session.phase.value).toBe('setActive')
    await session.completeSet()
    expect(session.phase.value).toBe('interval')
    session.nextSet()
    expect(session.phase.value).toBe('setActive')
    expect(session.currentReps.value).toBe(8)
    await session.completeSet()
    expect(session.phase.value).toBe('done')
  })

  test('editReps は完了済みセットの実績を更新し patchResultsAndStatus する', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 2 }))
    await session.completeSet()
    await session.editReps(0, 3)
    expect(session.session.value?.results.at(0)?.actualReps).toBe(3)
    expect(repo.calls.at(-1)).toMatchObject({
      method: 'patchResultsAndStatus',
      results: [{ actualReps: 3, memo: '' }],
    })
  })

  test('結果確認画面での実績編集は status を再導出し executed↔aborted を追従する', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 1, reps: 8 }))
    await session.completeSet()
    expect(session.session.value?.status).toBe('executed')

    // 目標未満へ編集 → aborted へ降格
    await session.editReps(0, 5)
    expect(session.session.value?.status).toBe('aborted')
    expect(session.isExecutedNow.value).toBe(false)
    expect(repo.calls.at(-1)).toMatchObject({ method: 'patchResultsAndStatus', status: 'aborted' })

    // 目標達成へ戻す → executed へ復帰
    await session.editReps(0, 8)
    expect(session.session.value?.status).toBe('executed')
    expect(repo.calls.at(-1)).toMatchObject({ method: 'patchResultsAndStatus', status: 'executed' })
  })

  test('editMemo は完了済みセットのメモを更新し patchResultsAndStatus する', async () => {
    const { repo, session } = setup()
    await session.start(menu({ sets: 2 }))
    await session.completeSet()
    await session.editMemo(0, 'フォームを意識した')
    expect(session.session.value?.results.at(0)?.memo).toBe('フォームを意識した')
    expect(repo.calls.at(-1)).toMatchObject({ method: 'patchResultsAndStatus' })
  })

  test('editCurrentReps は現セットの実績のみ変え、永続化しない', async () => {
    const { repo, session } = setup()
    await session.start(menu())
    const callsBefore = repo.calls.length
    session.editCurrentReps(5)
    expect(session.currentReps.value).toBe(5)
    expect(repo.calls).toHaveLength(callsBefore)
  })
})
