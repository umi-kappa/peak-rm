import { describe, expect, test } from 'vitest'

import { resolveInitialMenu } from '@/core/menu'
import type { Exercise, Session } from '@/core/types'

// menu.sets = 3 なので [5, 5, 5] が完遂、[5] は未実施セットありの中断になる
// （完遂判定の詳細は session.spec が担う）
function makeSession(exercise: Exercise, actualReps: number[], weight = 100): Session {
  return {
    id: 'prev',
    exercise,
    startedAt: 0,
    menu: { exercise, weight, reps: 5, sets: 3, intervalSec: 120 },
    results: actualReps.map((n) => ({ actualReps: n, memo: '' })),
  }
}

describe('resolveInitialMenu', () => {
  test('直前セッションが無ければ共通初期値 40kg / 8回 / 3セット / 90秒（プレビューなし）', () => {
    expect(resolveInitialMenu('benchPress', undefined)).toEqual({
      menu: { exercise: 'benchPress', weight: 40, reps: 8, sets: 3, intervalSec: 90 },
    })
  })

  test('直前が中断（未実施セットあり）なら直前セッションの menu を据え置きで初期表示（プレビューなし）', () => {
    const prev = makeSession('benchPress', [5])
    expect(resolveInitialMenu('benchPress', prev)).toEqual({ menu: prev.menu })
  })

  test('直前が完遂なら直前セッションの menu.weight に増量を適用し lpPreview を返す', () => {
    expect(resolveInitialMenu('benchPress', makeSession('benchPress', [5, 5, 5]))).toEqual({
      menu: { exercise: 'benchPress', weight: 102.5, reps: 5, sets: 3, intervalSec: 120 },
      lpPreview: { from: 100, to: 102.5 },
    })
  })

  test('スクワットの増量幅は +5kg', () => {
    expect(resolveInitialMenu('squat', makeSession('squat', [5, 5, 5]))).toEqual({
      menu: { exercise: 'squat', weight: 105, reps: 5, sets: 3, intervalSec: 120 },
      lpPreview: { from: 100, to: 105 },
    })
  })

  test('直前セッションの種目が引数と食い違っても引数の種目を勝たせる', () => {
    const { menu } = resolveInitialMenu('squat', makeSession('benchPress', [5]))
    expect(menu.exercise).toBe('squat')
  })

  test('返す menu は prevSession.menu のコピー（画面編集で履歴を汚さない）', () => {
    const prev = makeSession('benchPress', [5])
    const { menu } = resolveInitialMenu('benchPress', prev)
    menu.weight = 60
    expect(prev.menu.weight).toBe(100)
  })
})
