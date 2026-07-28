import { describe, expect, test } from 'vitest'

import { resolveInitialMenu } from '@/core/menu'
import type { Exercise, Session } from '@/core/types'

function makeSession(exercise: Exercise, status: Session['status'], weight = 100): Session {
  const menu = { exercise, weight, reps: 5, sets: 3, intervalSec: 120 }
  // executed は全セット target 達成、aborted は途中まで（isComplete 判定の詳細は session.spec が担う）
  const actualReps = status === 'executed' ? [5, 5, 5] : [5]
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
  test('直前セッションが無ければ共通初期値 40kg / 8回 / 3セット / 90秒（プレビューなし）', () => {
    expect(resolveInitialMenu('benchPress', undefined)).toEqual({
      menu: { exercise: 'benchPress', weight: 40, reps: 8, sets: 3, intervalSec: 90 },
    })
  })

  test('直前が aborted なら直前セッションの menu を据え置きで初期表示（プレビューなし）', () => {
    const prev = makeSession('benchPress', 'aborted')
    expect(resolveInitialMenu('benchPress', prev)).toEqual({ menu: prev.menu })
  })

  test('直前が executed なら直前セッションの menu.weight に増量を適用し lpPreview を返す', () => {
    expect(resolveInitialMenu('benchPress', makeSession('benchPress', 'executed'))).toEqual({
      menu: { exercise: 'benchPress', weight: 102.5, reps: 5, sets: 3, intervalSec: 120 },
      lpPreview: { from: 100, to: 102.5 },
    })
  })

  test('スクワットの増量幅は +5kg', () => {
    expect(resolveInitialMenu('squat', makeSession('squat', 'executed'))).toEqual({
      menu: { exercise: 'squat', weight: 105, reps: 5, sets: 3, intervalSec: 120 },
      lpPreview: { from: 100, to: 105 },
    })
  })

  test('返す menu は prevSession.menu のコピー（画面編集で履歴を汚さない）', () => {
    const prev = makeSession('benchPress', 'aborted')
    const { menu } = resolveInitialMenu('benchPress', prev)
    menu.weight = 60
    expect(prev.menu.weight).toBe(100)
  })
})
