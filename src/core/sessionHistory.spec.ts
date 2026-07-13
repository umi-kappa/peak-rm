import { describe, expect, test } from 'vitest'

import { dedupeHistoryByDay, localDayKey } from '@/core/sessionHistory'
import type { Exercise, SetResult, Session } from '@/core/types'

function reps(actualReps: number): SetResult {
  return { actualReps, memo: '' }
}

// results の既定値は実績 1 件。DB には実績のあるセッション（results.length >= 1）しか
// 存在しない不変条件（#80）に合わせる
function makeSession(
  id: string,
  exercise: Exercise,
  startedAt: number,
  status: Session['status'] = 'aborted',
  results: SetResult[] = [reps(8)],
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

// ローカル日付の構成要素から startedAt を作り、CI の TZ に依存しないようにする。
const day1Morning = new Date(2026, 0, 1, 9, 0).getTime()
const day1Evening = new Date(2026, 0, 1, 18, 0).getTime()
const day1Night = new Date(2026, 0, 1, 23, 59).getTime()
const day2Start = new Date(2026, 0, 2, 0, 0).getTime()

describe('localDayKey', () => {
  test('同日内の異なる時刻は同じキーになる', () => {
    expect(localDayKey(day1Morning)).toBe(localDayKey(day1Night))
  })

  test('ローカル日付境界（23:59 と翌 00:00）は別キーになる', () => {
    expect(localDayKey(day1Night)).not.toBe(localDayKey(day2Start))
  })
})

describe('dedupeHistoryByDay', () => {
  test('同日同種目で executed があれば、後発の aborted より executed を優先する', () => {
    const result = dedupeHistoryByDay([
      makeSession('done', 'benchPress', day1Morning, 'executed', [reps(8), reps(8), reps(8)]),
      makeSession('reopenedAborted', 'benchPress', day1Evening, 'aborted'),
    ])
    expect(result.map((s) => s.id)).toEqual(['done'])
  })

  test('同日同種目・同 status では、最新ではなく推定 1RM が最大のものを残す', () => {
    // 早い方が高 reps（高 1RM）、遅い方が低 reps（低 1RM）。ベスト記録の earlyBest を採用する。
    const result = dedupeHistoryByDay([
      makeSession('earlyBest', 'benchPress', day1Morning, 'executed', [
        reps(10),
        reps(10),
        reps(10),
      ]),
      makeSession('lateWorse', 'benchPress', day1Evening, 'executed', [reps(8), reps(8), reps(8)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['earlyBest'])
  })

  test('executed が無く全 aborted なら、最新ではなく推定 1RM が最大の aborted を残す', () => {
    // 早い方が高 reps（高 1RM）。executed が 1 件も無い場合の「aborted の中で 1RM 最大」分岐。
    const result = dedupeHistoryByDay([
      makeSession('abortedBest', 'benchPress', day1Morning, 'aborted', [reps(10)]),
      makeSession('abortedWorse', 'benchPress', day1Evening, 'aborted', [reps(5)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['abortedBest'])
  })

  test('入力順に依らず executed を優先する（aborted が先・executed が後でも executed を残す）', () => {
    // DB が startedAt 昇順で渡すケース。先に Map へ入った aborted を後続 executed が置き換える分岐。
    const result = dedupeHistoryByDay([
      makeSession('abortedFirst', 'benchPress', day1Morning, 'aborted'),
      makeSession('executedLater', 'benchPress', day1Evening, 'executed', [
        reps(8),
        reps(8),
        reps(8),
      ]),
    ])
    expect(result.map((s) => s.id)).toEqual(['executedLater'])
  })

  test('同日同種目・同 status・1RM 同値なら最新（startedAt 最大）を残す', () => {
    const result = dedupeHistoryByDay([
      makeSession('early', 'benchPress', day1Morning, 'executed', [reps(8), reps(8), reps(8)]),
      makeSession('late', 'benchPress', day1Evening, 'executed', [reps(8), reps(8), reps(8)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['late'])
  })

  test('同日でも種目が違えば両方残る', () => {
    const result = dedupeHistoryByDay([
      makeSession('bench', 'benchPress', day1Morning),
      makeSession('squat', 'squat', day1Evening),
    ])
    expect(result.map((s) => s.id).sort()).toEqual(['bench', 'squat'])
  })

  test('日付が違えば同種目でも両方残る', () => {
    const result = dedupeHistoryByDay([
      makeSession('d1', 'benchPress', day1Morning),
      makeSession('d2', 'benchPress', day2Start),
    ])
    expect(result).toHaveLength(2)
  })

  test('入力順に依らず startedAt 降順で返す', () => {
    const result = dedupeHistoryByDay([
      makeSession('d1', 'benchPress', day1Morning),
      makeSession('d2', 'squat', day2Start),
    ])
    expect(result.map((s) => s.id)).toEqual(['d2', 'd1'])
  })
})
