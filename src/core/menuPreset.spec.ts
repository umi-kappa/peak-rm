import { describe, expect, test } from 'vitest'

import { resolveInitialMenu } from '@/core/menuPreset'
import type { Exercise, MenuPreset, Session } from '@/core/types'

function makePreset(weight: number): MenuPreset {
  return { exercise: 'benchPress', weight, reps: 5, sets: 5, intervalSec: 120 }
}

function makeSession(exercise: Exercise, status: Session['status']): Session {
  const menu = { exercise, weight: 100, reps: 8, sets: 3, intervalSec: 90 }
  // executed は全セット target 達成、aborted は途中まで（isExecuted 判定の詳細は session.spec が担う）
  const actualReps = status === 'executed' ? [8, 8, 8] : [8]
  return {
    id: 'prev',
    exercise,
    status,
    startedAt: 0,
    menu,
    results: actualReps.map((n) => ({ actualReps: n, memo: '' })),
  }
}

describe('resolveInitialMenu', () => {
  test('preset が無ければ共通初期値 40kg / 8回 / 3セット / 90秒（プレビューなし）', () => {
    expect(resolveInitialMenu('benchPress', undefined, undefined)).toEqual({
      menu: { exercise: 'benchPress', weight: 40, reps: 8, sets: 3, intervalSec: 90 },
    })
  })

  test('preset があれば種目別の最後値をそのまま初期表示（直前セッションなし・プレビューなし）', () => {
    const preset = makePreset(100)
    expect(resolveInitialMenu('benchPress', preset, undefined)).toEqual({ menu: preset })
  })

  test('直前が executed なら重量に増量を適用し lpPreview を返す', () => {
    expect(
      resolveInitialMenu('benchPress', makePreset(100), makeSession('benchPress', 'executed')),
    ).toEqual({
      menu: { exercise: 'benchPress', weight: 102.5, reps: 5, sets: 5, intervalSec: 120 },
      lpPreview: { from: 100, to: 102.5 },
    })
  })

  test('直前が aborted なら据え置き（プレビューなし）', () => {
    const preset = makePreset(100)
    expect(resolveInitialMenu('benchPress', preset, makeSession('benchPress', 'aborted'))).toEqual({
      menu: preset,
    })
  })

  test('preset が無くても直前 executed セッションがあれば共通初期値に増量する', () => {
    expect(resolveInitialMenu('squat', undefined, makeSession('squat', 'executed'))).toEqual({
      menu: { exercise: 'squat', weight: 45, reps: 8, sets: 3, intervalSec: 90 },
      lpPreview: { from: 40, to: 45 },
    })
  })
})
