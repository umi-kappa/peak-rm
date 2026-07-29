import { beforeEach, describe, expect, test } from 'vitest'

import { db } from '@/storage/db'
import { sessionRepo } from '@/storage/sessionRepo'
import type { Exercise, SetResult, Session } from '@/core/types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

// results の既定値は実績 1 件。DB には実績のあるセッション（results.length >= 1）しか
// 存在しない不変条件（#80）に合わせる
function makeSession(
  id: string,
  exercise: Exercise,
  startedAt: number,
  results: SetResult[] = [reps(8)],
): Session {
  return {
    id,
    exercise,
    startedAt,
    menu: { exercise, weight: 100, reps: 8, sets: 3, intervalSec: 90 },
    results,
  }
}

function reps(actualReps: number): SetResult {
  return { actualReps, memo: '' }
}

describe('永続化シーケンス', () => {
  test('初回セット完了の insert → 増分 patch で全セットの results が揃う', async () => {
    await sessionRepo.insert(makeSession('s1', 'benchPress', 1000, [reps(8)]))
    expect((await db.sessions.get('s1'))?.results).toHaveLength(1)

    await sessionRepo.patchResults('s1', [reps(8), reps(8)])
    expect((await db.sessions.get('s1'))?.results).toHaveLength(2)

    // 最終セット完了も同じ patchResults で足りる（完遂確定のための特別な書き込みは無い）
    await sessionRepo.patchResults('s1', [reps(8), reps(8), reps(8)])
    expect((await db.sessions.get('s1'))?.results).toHaveLength(3)
  })

  test('results が空のセッションは insert を拒否する（不変条件: 実績のあるセッションのみ保存）', async () => {
    await expect(sessionRepo.insert(makeSession('empty', 'benchPress', 1000, []))).rejects.toThrow()
    expect(await db.sessions.get('empty')).toBeUndefined()
  })

  test('同一 id を 2 回 insert すると例外を投げる', async () => {
    await sessionRepo.insert(makeSession('dup', 'squat', 1000))
    await expect(sessionRepo.insert(makeSession('dup', 'squat', 2000))).rejects.toThrow()
  })

  test('patchResults は results を全置換する（merge ではない）', async () => {
    await sessionRepo.insert(makeSession('s1', 'benchPress', 1000))
    await sessionRepo.patchResults('s1', [reps(8), reps(8), reps(8)])
    // 後続 patch が少ない件数で来ても上書きされ、append で 4 件にはならない
    await sessionRepo.patchResults('s1', [reps(5)])

    const updated = await db.sessions.get('s1')
    expect(updated?.results).toEqual([reps(5)])
  })

  test('patchResults を存在しない id に呼ぶと例外を投げる（サイレント no-op を防ぐ）', async () => {
    await expect(sessionRepo.patchResults('missing', [reps(8)])).rejects.toThrow()
  })
})

describe('remove', () => {
  test('当該 1 件のみ削除し、他セッションに影響しない', async () => {
    await sessionRepo.insert(makeSession('keep', 'benchPress', 1000))
    await sessionRepo.insert(makeSession('gone', 'squat', 2000))

    await sessionRepo.remove('gone')

    expect(await db.sessions.get('gone')).toBeUndefined()
    expect(await db.sessions.get('keep')).toBeDefined()
  })
})

describe('list', () => {
  test('startedAt 降順で返す', async () => {
    await sessionRepo.insert(makeSession('a', 'benchPress', 1000))
    await sessionRepo.insert(makeSession('c', 'squat', 3000))
    await sessionRepo.insert(makeSession('b', 'deadlift', 2000))

    const sessions = await sessionRepo.list()
    expect(sessions.map((s) => s.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('listForHistory', () => {
  // ローカル日付の構成要素から startedAt を作り、CI の TZ に依存しないようにする。
  const day1Morning = new Date(2026, 0, 1, 9, 0).getTime()
  const day1Evening = new Date(2026, 0, 1, 18, 0).getTime()
  const day2 = new Date(2026, 0, 2, 9, 0).getTime()

  test('DB 経由で取得し、同日同種目は集約規則（完遂優先 → 1RM 最大 → startedAt 最大）で 1 件に絞り startedAt 降順で返す', async () => {
    // 朝は完遂・夜は中断を同日同種目で insert。後発の中断が完遂記録を上書きせず
    // 完遂の benchMorning が残ることを DB → list() → dedupeHistoryByDay の統合パスで確認する。
    await sessionRepo.insert(
      makeSession('benchMorning', 'benchPress', day1Morning, [reps(8), reps(8), reps(8)]),
    )
    await sessionRepo.insert(makeSession('benchEvening', 'benchPress', day1Evening))
    await sessionRepo.insert(makeSession('squatDay2', 'squat', day2))

    const sessions = await sessionRepo.listForHistory()
    expect(sessions.map((s) => s.id)).toEqual(['squatDay2', 'benchMorning'])
  })
})

describe('get', () => {
  test('id で当該 1 件を返す', async () => {
    await sessionRepo.insert(makeSession('target', 'benchPress', 1000))
    await sessionRepo.insert(makeSession('other', 'squat', 2000))
    expect((await sessionRepo.get('target'))?.id).toBe('target')
  })

  test('存在しない id は undefined', async () => {
    expect(await sessionRepo.get('missing')).toBeUndefined()
  })
})

describe('latestCompleteBefore', () => {
  // menu.sets = 3 に対して 3 セットすべて target 達成 = 完遂
  const completeResults = [reps(8), reps(8), reps(8)]

  test('startedAt より前の直近の完遂セッションを返す（当該セッション自身は含めない）', async () => {
    await sessionRepo.insert(makeSession('older', 'benchPress', 1000, completeResults))
    await sessionRepo.insert(makeSession('prev', 'benchPress', 2000, completeResults))
    // 当該セッション（結果確認中の本人）。上限排他で除外される
    await sessionRepo.insert(makeSession('self', 'benchPress', 3000, completeResults))

    expect((await sessionRepo.latestCompleteBefore('benchPress', 3000))?.id).toBe('prev')
  })

  test('未完遂はスキップしてさらに前の完遂セッションを返す', async () => {
    await sessionRepo.insert(makeSession('complete', 'benchPress', 1000, completeResults))
    await sessionRepo.insert(makeSession('aborted', 'benchPress', 2000))

    expect((await sessionRepo.latestCompleteBefore('benchPress', 3000))?.id).toBe('complete')
  })

  // 未完遂には「未実施セットあり」と「全セット完走・目標未達」の 2 経路があり、filter が
  // results の件数だけを見る実装に退化しても前者では気づけないため後者も固定する
  test('全セット完走・目標未達もスキップしてさらに前の完遂セッションを返す', async () => {
    await sessionRepo.insert(makeSession('complete', 'benchPress', 1000, completeResults))
    await sessionRepo.insert(
      makeSession('finished', 'benchPress', 2000, [reps(8), reps(8), reps(7)]),
    )

    expect((await sessionRepo.latestCompleteBefore('benchPress', 3000))?.id).toBe('complete')
  })

  test('他種目の完遂セッションは無視する', async () => {
    await sessionRepo.insert(makeSession('squat', 'squat', 1000, completeResults))

    expect(await sessionRepo.latestCompleteBefore('benchPress', 3000)).toBeUndefined()
  })

  test('前に完遂セッションが無ければ undefined（初回セッション）', async () => {
    await sessionRepo.insert(makeSession('self', 'benchPress', 1000, completeResults))

    expect(await sessionRepo.latestCompleteBefore('benchPress', 1000)).toBeUndefined()
  })
})

describe('latestByExercise', () => {
  test('該当種目が無ければ undefined', async () => {
    await sessionRepo.insert(makeSession('s', 'squat', 1000))
    expect(await sessionRepo.latestByExercise('benchPress')).toBeUndefined()
  })

  test('複数件あれば startedAt 最大の 1 件を返す', async () => {
    await sessionRepo.insert(makeSession('old', 'benchPress', 1000))
    await sessionRepo.insert(makeSession('new', 'benchPress', 3000))
    await sessionRepo.insert(makeSession('mid', 'benchPress', 2000))
    expect((await sessionRepo.latestByExercise('benchPress'))?.id).toBe('new')
  })

  test('他種目のセッションは無視する', async () => {
    await sessionRepo.insert(makeSession('squat', 'squat', 5000))
    await sessionRepo.insert(makeSession('bench', 'benchPress', 1000))
    expect((await sessionRepo.latestByExercise('benchPress'))?.id).toBe('bench')
  })

  test('未完遂でも直前なら返す（完遂で絞らない）', async () => {
    await sessionRepo.insert(makeSession('aborted', 'benchPress', 1000))
    expect((await sessionRepo.latestByExercise('benchPress'))?.id).toBe('aborted')
  })
})
