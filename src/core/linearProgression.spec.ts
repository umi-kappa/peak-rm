import { describe, expect, test } from 'vitest'

import { computeLinearProgression } from '@/core/linearProgression'
import type { Exercise, SetResult, Session } from '@/core/types'

function makeSession(
  exercise: Exercise,
  reps: number,
  sets: number,
  results: SetResult[],
  status: Session['status'] = 'executed',
): Session {
  return {
    id: 'prev',
    exercise,
    status,
    startedAt: 0,
    menu: { exercise, weight: 100, reps, sets, intervalSec: 90 },
    results,
  }
}

function rep(actualReps: number): SetResult {
  return { actualReps, memo: '' }
}

describe('computeLinearProgression', () => {
  test('直前 executed のベンチプレスは +2.5kg', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8), rep(8), rep(8)])
    expect(computeLinearProgression('benchPress', prev, 100)).toBe(102.5)
  })

  test('直前 executed のスクワットは +5kg', () => {
    const prev = makeSession('squat', 5, 3, [rep(5), rep(5), rep(5)])
    expect(computeLinearProgression('squat', prev, 100)).toBe(105)
  })

  test('直前 executed のデッドリフトは +5kg', () => {
    const prev = makeSession('deadlift', 5, 1, [rep(5)])
    expect(computeLinearProgression('deadlift', prev, 100)).toBe(105)
  })

  test('直前セッションが無ければ据え置き', () => {
    expect(computeLinearProgression('benchPress', null, 100)).toBe(100)
  })

  test('直前が失敗（target 未満セットあり）なら据え置き', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8), rep(6), rep(8)])
    expect(computeLinearProgression('benchPress', prev, 100)).toBe(100)
  })

  test('直前が中断（results 不足）なら据え置き', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8)], 'aborted')
    expect(computeLinearProgression('benchPress', prev, 100)).toBe(100)
  })
})
