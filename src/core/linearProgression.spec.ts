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
  test('直前 executed のベンチプレスは menu.weight + 2.5kg を返す', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8), rep(8), rep(8)])
    expect(computeLinearProgression(prev)).toBe(102.5)
  })

  test('直前 executed のスクワットは menu.weight + 5kg を返す', () => {
    const prev = makeSession('squat', 5, 3, [rep(5), rep(5), rep(5)])
    expect(computeLinearProgression(prev)).toBe(105)
  })

  test('直前 executed のデッドリフトは menu.weight + 5kg を返す', () => {
    const prev = makeSession('deadlift', 5, 1, [rep(5)])
    expect(computeLinearProgression(prev)).toBe(105)
  })

  test('直前セッションが無ければ undefined（据え置き）', () => {
    expect(computeLinearProgression(undefined)).toBeUndefined()
  })

  test('直前が失敗（target 未満セットあり）なら undefined（据え置き）', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8), rep(6), rep(8)])
    expect(computeLinearProgression(prev)).toBeUndefined()
  })

  test('直前が中断（results 不足）なら undefined（据え置き）', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8)], 'aborted')
    expect(computeLinearProgression(prev)).toBeUndefined()
  })

  test('status が aborted なら results が full でも undefined（据え置き）', () => {
    const prev = makeSession('benchPress', 8, 3, [rep(8), rep(8), rep(8)], 'aborted')
    expect(computeLinearProgression(prev)).toBeUndefined()
  })
})
