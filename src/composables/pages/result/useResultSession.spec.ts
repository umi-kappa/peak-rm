import { describe, expect, test, vi } from 'vitest'
import { shallowRef } from 'vue'

import {
  useResultSession,
  type ResultSessionDeps,
} from '@/composables/pages/result/useResultSession'
import type { Session, SetResult } from '@/core/types'

// Session fixture（sets を実績件数より多く指定すると中断 = 未実施セットありになる）
function makeSession(options: {
  id?: string
  startedAt?: number
  weight?: number
  sets?: number
  actualReps: number[]
  memos?: string[]
}): Session {
  const { id = 'current', startedAt = 2000, weight = 100, actualReps, memos = [] } = options
  return {
    id,
    exercise: 'benchPress',
    startedAt,
    menu: {
      exercise: 'benchPress',
      weight,
      reps: 8,
      sets: options.sets ?? actualReps.length,
      intervalSec: 90,
    },
    results: actualReps.map((reps, i) => ({ actualReps: reps, memo: memos[i] ?? '' })),
  }
}

// store / repo の fake を束ねた deps。store は実装と同じイミュータブル更新で編集を反映する
function makeDeps(options: { storeSession?: Session; stored?: Session[]; prev?: Session } = {}) {
  const storeRef = shallowRef<Session | undefined>(options.storeSession)
  const store = {
    session: storeRef,
    patchResultAt: vi.fn(async (index: number, patch: Partial<SetResult>) => {
      const current = storeRef.value
      if (current === undefined) return
      // 本番 useSession.patchResultAt と同じくイミュータブルに results を差し替える
      const results = current.results.map((r, i) => (i === index ? { ...r, ...patch } : r))
      storeRef.value = { ...current, results }
    }),
  }
  const repo = {
    get: vi.fn(async (id: string) => options.stored?.find((s) => s.id === id)),
    patchResults: vi.fn(async () => {}),
    latestCompleteBefore: vi.fn(async () => options.prev),
    remove: vi.fn(async () => {}),
  }
  const deps: ResultSessionDeps = { store, repo }
  return { deps, store, repo }
}

describe('session origin', () => {
  test('store のセッションを参照し 1RM を導出する', () => {
    const { deps } = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 8] }) })
    const result = useResultSession('session', undefined, deps)

    expect(result.session.value?.id).toBe('current')
    // benchPress: 100 × (1 + 8 / 40) = 120
    expect(result.maxOneRm.value).toBeCloseTo(120)
    // ヘッダ日付は履歴詳細のみ（origin 規則は composable が判定する）
    expect(result.dayLabel.value).toBeUndefined()
  })

  test('load が同一種目・当該より前の直近の完遂セッションを取得し delta を導出する', async () => {
    const prev = makeSession({ id: 'prev', startedAt: 1000, weight: 97.5, actualReps: [8, 8, 8] })
    const { deps, repo } = makeDeps({
      storeSession: makeSession({ actualReps: [8, 8, 8] }),
      prev,
    })
    const result = useResultSession('session', undefined, deps)
    await result.load()

    expect(repo.latestCompleteBefore).toHaveBeenCalledWith('benchPress', 2000)
    // 120 − 97.5 × 1.2 = 120 − 117 = +3
    expect(result.delta.value).toBeCloseTo(3)
  })

  test('前回の完遂セッションが無ければ delta は undefined', async () => {
    const { deps } = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 8] }) })
    const result = useResultSession('session', undefined, deps)
    await result.load()

    expect(result.delta.value).toBeUndefined()
  })

  test('当日の 1RM が 0（全セットスキップ）なら delta は undefined', async () => {
    const prev = makeSession({ id: 'prev', startedAt: 1000, actualReps: [8, 8, 8] })
    const { deps } = makeDeps({ storeSession: makeSession({ actualReps: [0, 0, 0] }), prev })
    const result = useResultSession('session', undefined, deps)
    await result.load()

    expect(result.maxOneRm.value).toBe(0)
    expect(result.delta.value).toBeUndefined()
  })

  test('完遂セッションは lpPreview に今回 → 増量後の重量ペアを返し、未達は undefined', () => {
    const { deps: completeDeps } = makeDeps({
      storeSession: makeSession({ actualReps: [8, 8, 8] }),
    })
    expect(useResultSession('session', undefined, completeDeps).lpPreview.value).toEqual({
      from: 100,
      to: 102.5,
    })

    const { deps: missedDeps } = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 7] }) })
    expect(useResultSession('session', undefined, missedDeps).lpPreview.value).toBeUndefined()
  })

  test('marker は中断 = aborted / 完走未達 = finished / 完遂 = complete を導出する', () => {
    const aborted = makeDeps({ storeSession: makeSession({ actualReps: [8], sets: 3 }) })
    expect(useResultSession('session', undefined, aborted.deps).marker.value).toBe('aborted')

    const finished = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 7] }) })
    expect(useResultSession('session', undefined, finished.deps).marker.value).toBe('finished')

    const complete = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 8] }) })
    expect(useResultSession('session', undefined, complete.deps).marker.value).toBe('complete')
  })

  test('patchResultAt は store へ委譲し、編集が 1RM に反映される', async () => {
    const { deps, store } = makeDeps({ storeSession: makeSession({ actualReps: [8, 8, 8] }) })
    const result = useResultSession('session', undefined, deps)

    await result.patchResultAt(2, { actualReps: 9 })

    expect(store.patchResultAt).toHaveBeenCalledWith(2, { actualReps: 9 })
    // 100 × (1 + 9 / 40) = 122.5
    expect(result.maxOneRm.value).toBeCloseTo(122.5)
  })
})

describe('history origin', () => {
  const stored = makeSession({
    id: 'past',
    // ローカル日付の構成要素から作り、CI の TZ に依存しない
    startedAt: new Date(2025, 4, 12, 9, 0).getTime(),
    actualReps: [8, 8, 8],
    memos: ['フォーム良し', '', ''],
  })

  test('load が id でロードして session・dayLabel に反映する', async () => {
    const { deps } = makeDeps({ stored: [stored] })
    const result = useResultSession('history', 'past', deps)

    await expect(result.load()).resolves.toBe(true)
    expect(result.session.value?.id).toBe('past')
    expect(result.dayLabel.value).toBe('2025/05/12')
  })

  test('id が無い・見つからないときは load が false を返す', async () => {
    const missingId = useResultSession('history', 'missing', makeDeps({ stored: [stored] }).deps)
    await expect(missingId.load()).resolves.toBe(false)

    const noId = useResultSession('history', undefined, makeDeps().deps)
    await expect(noId.load()).resolves.toBe(false)
  })

  test('完遂セッションでも lpPreview は常に undefined（過去に「次回」は無い）', async () => {
    const { deps } = makeDeps({ stored: [stored] })
    const result = useResultSession('history', 'past', deps)
    await result.load()

    expect(result.marker.value).toBe('complete')
    expect(result.lpPreview.value).toBeUndefined()
  })

  test('patchResultAt は repo.patchResults で保存しローカルへ反映する（store は触らない）', async () => {
    const { deps, store, repo } = makeDeps({ stored: [stored] })
    const result = useResultSession('history', 'past', deps)
    await result.load()

    await result.patchResultAt(1, { memo: '重かった' })

    expect(store.patchResultAt).not.toHaveBeenCalled()
    expect(repo.patchResults).toHaveBeenCalledWith('past', [
      { actualReps: 8, memo: 'フォーム良し' },
      { actualReps: 8, memo: '重かった' },
      { actualReps: 8, memo: '' },
    ])
    expect(result.session.value?.results[1]?.memo).toBe('重かった')
  })

  test('remove は当該セッションの id で repo.remove へ委譲する', async () => {
    const { deps, repo } = makeDeps({ stored: [stored] })
    const result = useResultSession('history', 'past', deps)
    await result.load()

    await result.remove()

    expect(repo.remove).toHaveBeenCalledWith('past')
  })
})
