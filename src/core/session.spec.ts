import { describe, expect, test } from 'vitest'

import { formatSetReps, isComplete, sessionMaxOneRm, sessionOutcome } from '@/core/session'
import type { Exercise, SetResult, Session } from '@/core/types'

function makeSession(
  exercise: Exercise,
  weight: number,
  reps: number,
  sets: number,
  results: SetResult[],
  status: Session['status'] = 'executed',
): Session {
  return {
    id: 'test',
    exercise,
    status,
    startedAt: 0,
    menu: { exercise, weight, reps, sets, intervalSec: 90 },
    results,
  }
}

function reps(actualReps: number): SetResult {
  return { actualReps, memo: '' }
}

describe('sessionMaxOneRm', () => {
  test('複数セットのうち最大の 1RM を採用する', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(10), reps(6)])
    expect(sessionMaxOneRm(session)).toBe(100 * (1 + 10 / 40))
  })

  test('実績 0 回のセットは除外する', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(0), reps(5), reps(0)])
    expect(sessionMaxOneRm(session)).toBe(112.5)
  })

  test('aborted でも実施済みセットがあれば算出する', () => {
    const session = makeSession('squat', 100, 8, 3, [reps(8)], 'aborted')
    expect(sessionMaxOneRm(session)).toBeCloseTo(100 * (1 + 8 / 33.3))
  })

  test('全セット 0 回なら 0 を返す', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(0), reps(0), reps(0)])
    expect(sessionMaxOneRm(session)).toBe(0)
  })

  test('results が空なら 0 を返す', () => {
    const session = makeSession('benchPress', 100, 8, 3, [])
    expect(sessionMaxOneRm(session)).toBe(0)
  })
})

describe('formatSetReps', () => {
  test('各セットの実績回数を / 連結する', () => {
    const session = makeSession('benchPress', 82.5, 8, 3, [reps(8), reps(8), reps(7)])
    expect(formatSetReps(session)).toBe('8/8/7')
  })

  test('スキップ（0 回）も除外せずそのまま出す', () => {
    const session = makeSession('benchPress', 82.5, 8, 3, [reps(8), reps(8), reps(0)])
    expect(formatSetReps(session)).toBe('8/8/0')
  })

  test('1 セットなら区切りなしで返す', () => {
    const session = makeSession('squat', 100, 5, 1, [reps(5)])
    expect(formatSetReps(session)).toBe('5')
  })

  test('results が空なら空文字を返す', () => {
    const session = makeSession('deadlift', 120, 5, 3, [])
    expect(formatSetReps(session)).toBe('')
  })
})

describe('isComplete', () => {
  test('全セット完了かつ全セット target 達成なら true', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(9), reps(8)])
    expect(isComplete(session)).toBe(true)
  })

  test('1 セットでも target を下回れば false', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(7), reps(8)])
    expect(isComplete(session)).toBe(false)
  })

  test('results が menu.sets に満たない（中断）なら false', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(8)])
    expect(isComplete(session)).toBe(false)
  })

  test('results が空なら false', () => {
    const session = makeSession('benchPress', 100, 8, 3, [])
    expect(isComplete(session)).toBe(false)
  })
})

describe('sessionOutcome', () => {
  test('未実施セットがあれば aborted（中断）', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8)])
    expect(sessionOutcome(session)).toBe('aborted')
  })

  test('全セット完走したが目標未達なら finished', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(8), reps(7)])
    expect(sessionOutcome(session)).toBe('finished')
  })

  test('完遂（isComplete）なら complete', () => {
    const session = makeSession('benchPress', 100, 8, 3, [reps(8), reps(8), reps(8)])
    expect(sessionOutcome(session)).toBe('complete')
  })
})
