import { describe, expect, test } from 'vitest'

import { dedupeHistoryByDayLatest, localDayKey } from '@/core/sessionHistory'
import type { Exercise, Session } from '@/core/types'

function makeSession(id: string, exercise: Exercise, startedAt: number): Session {
  return {
    id,
    exercise,
    status: 'aborted',
    startedAt,
    menu: { exercise, weight: 100, reps: 8, sets: 3, intervalSec: 90 },
    results: [],
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

describe('dedupeHistoryByDayLatest', () => {
  test('同日同種目は最新 1 件のみ残す', () => {
    const result = dedupeHistoryByDayLatest([
      makeSession('old', 'benchPress', day1Morning),
      makeSession('new', 'benchPress', day1Evening),
    ])
    expect(result.map((s) => s.id)).toEqual(['new'])
  })

  test('同日でも種目が違えば両方残る', () => {
    const result = dedupeHistoryByDayLatest([
      makeSession('bench', 'benchPress', day1Morning),
      makeSession('squat', 'squat', day1Evening),
    ])
    expect(result.map((s) => s.id).sort()).toEqual(['bench', 'squat'])
  })

  test('日付が違えば同種目でも両方残る', () => {
    const result = dedupeHistoryByDayLatest([
      makeSession('d1', 'benchPress', day1Morning),
      makeSession('d2', 'benchPress', day2Start),
    ])
    expect(result).toHaveLength(2)
  })

  test('入力順に依らず startedAt 降順で返す', () => {
    const result = dedupeHistoryByDayLatest([
      makeSession('d1', 'benchPress', day1Morning),
      makeSession('d2', 'squat', day2Start),
    ])
    expect(result.map((s) => s.id)).toEqual(['d2', 'd1'])
  })
})
