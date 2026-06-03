import { beforeEach, describe, expect, test } from 'vitest'

import { db } from '@/storage/db'
import { sessionRepo } from '@/storage/sessionRepo'
import type { Exercise, SetResult, Session } from '@/core/types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function makeSession(
  id: string,
  exercise: Exercise,
  startedAt: number,
  results: SetResult[] = [],
  status: Session['status'] = 'aborted',
): Session {
  return {
    id,
    exercise,
    status,
    startedAt,
    menu: { exercise, weight: 100, reps: 8, sets: 3, intervalSec: 90 },
    results,
  }
}

function reps(actualReps: number): SetResult {
  return { actualReps, memo: '' }
}

describe('永続化シーケンス', () => {
  test('aborted insert → 増分 patch → finalize で executed と全 results が揃う', async () => {
    await sessionRepo.insert(makeSession('s1', 'benchPress', 1000))
    expect((await db.sessions.get('s1'))?.status).toBe('aborted')

    await sessionRepo.patchResults('s1', [reps(8)])
    await sessionRepo.patchResults('s1', [reps(8), reps(8)])
    const mid = await db.sessions.get('s1')
    expect(mid?.status).toBe('aborted')
    expect(mid?.results).toHaveLength(2)

    await sessionRepo.finalize('s1', [reps(8), reps(8), reps(8)])
    const done = await db.sessions.get('s1')
    expect(done?.status).toBe('executed')
    expect(done?.results).toHaveLength(3)
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
})

describe('remove', () => {
  test('当該 1 件のみ削除し、他セッション・menuPresets に影響しない', async () => {
    await sessionRepo.insert(makeSession('keep', 'benchPress', 1000))
    await sessionRepo.insert(makeSession('gone', 'squat', 2000))
    await db.menuPresets.put({ exercise: 'squat', weight: 60, reps: 5, sets: 3, intervalSec: 90 })

    await sessionRepo.remove('gone')

    expect(await db.sessions.get('gone')).toBeUndefined()
    expect(await db.sessions.get('keep')).toBeDefined()
    expect(await db.menuPresets.get('squat')).toBeDefined()
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

  test('DB 経由で取得し、同日同種目は最新 1 件に集約して startedAt 降順で返す', async () => {
    await sessionRepo.insert(makeSession('benchMorning', 'benchPress', day1Morning))
    await sessionRepo.insert(makeSession('benchEvening', 'benchPress', day1Evening))
    await sessionRepo.insert(makeSession('squatDay2', 'squat', day2))

    const sessions = await sessionRepo.listForHistory()
    expect(sessions.map((s) => s.id)).toEqual(['squatDay2', 'benchEvening'])
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

  test('aborted でも直前なら返す（ステータスで絞らない）', async () => {
    await sessionRepo.insert(makeSession('aborted', 'benchPress', 1000, [reps(8)], 'aborted'))
    expect((await sessionRepo.latestByExercise('benchPress'))?.id).toBe('aborted')
  })
})
