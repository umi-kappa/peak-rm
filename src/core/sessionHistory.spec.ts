import { describe, expect, test } from 'vitest'

import {
  dedupeHistoryByDay,
  formatLocalDay,
  formatLocalMonthDay,
  localDayKey,
} from '@/core/sessionHistory'
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

describe('formatLocalDay', () => {
  test('ローカル日付を YYYY/MM/DD 形式で返す（月日はゼロ詰め）', () => {
    expect(formatLocalDay(day1Morning)).toBe('2026/01/01')
  })
})

describe('formatLocalMonthDay', () => {
  test('ローカル日付を MM/DD 形式で返す（年を落とし、1 桁はゼロ詰め・2 桁はそのまま）', () => {
    expect(formatLocalMonthDay(day1Morning)).toBe('01/01')
    expect(formatLocalMonthDay(new Date(2026, 11, 25, 9, 0).getTime())).toBe('12/25')
  })
})

describe('dedupeHistoryByDay', () => {
  test('同日同種目で完遂があれば、後発の未完遂より完遂を優先する', () => {
    const result = dedupeHistoryByDay([
      makeSession('done', 'benchPress', day1Morning, [reps(8), reps(8), reps(8)]),
      makeSession('reopenedAborted', 'benchPress', day1Evening),
    ])
    expect(result.map((s) => s.id)).toEqual(['done'])
  })

  test('同日同種目でともに完遂なら、最新ではなく推定 1RM が最大のものを残す', () => {
    // 早い方が高 reps（高 1RM）、遅い方が低 reps（低 1RM）。ベスト記録の earlyBest を採用する。
    const result = dedupeHistoryByDay([
      makeSession('earlyBest', 'benchPress', day1Morning, [reps(10), reps(10), reps(10)]),
      makeSession('lateWorse', 'benchPress', day1Evening, [reps(8), reps(8), reps(8)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['earlyBest'])
  })

  test('完遂が無く全て未完遂なら、最新ではなく推定 1RM が最大の未完遂を残す', () => {
    // 早い方が高 reps（高 1RM）。完遂が 1 件も無い場合の「未完遂の中で 1RM 最大」分岐。
    const result = dedupeHistoryByDay([
      makeSession('abortedBest', 'benchPress', day1Morning, [reps(10)]),
      makeSession('abortedWorse', 'benchPress', day1Evening, [reps(5)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['abortedBest'])
  })

  test('入力順に依らず完遂を優先する（未完遂が先・完遂が後でも完遂を残す）', () => {
    // DB が startedAt 昇順で渡すケース。先に Map へ入った未完遂を後続の完遂が置き換える分岐。
    const result = dedupeHistoryByDay([
      makeSession('abortedFirst', 'benchPress', day1Morning),
      makeSession('completeLater', 'benchPress', day1Evening, [reps(8), reps(8), reps(8)]),
    ])
    expect(result.map((s) => s.id)).toEqual(['completeLater'])
  })

  test('同日同種目でともに完遂・1RM 同値なら最新（startedAt 最大）を残す', () => {
    const result = dedupeHistoryByDay([
      makeSession('early', 'benchPress', day1Morning, [reps(8), reps(8), reps(8)]),
      makeSession('late', 'benchPress', day1Evening, [reps(8), reps(8), reps(8)]),
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
