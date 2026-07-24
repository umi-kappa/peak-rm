import { expect, test } from 'vitest'

import { useSetTimeline } from '@/composables/shared/session/useSetTimeline'
import type { ReadonlySession, SetResult } from '@/core/types'

// done を doneCount 個持つ benchPress セッション。sets で総セット数（＝カード枚数）を指定する
function session(doneCount: number, sets: number): ReadonlySession {
  const results: SetResult[] = Array.from({ length: doneCount }, (_, i) => ({
    actualReps: 8,
    memo: `memo${i}`,
  }))
  return {
    id: 's',
    exercise: 'benchPress',
    status: 'aborted',
    startedAt: 0,
    menu: { exercise: 'benchPress', weight: 100, reps: 8, sets, intervalSec: 90 },
    results,
  }
}

function states(session: ReadonlySession, live: boolean): string[] {
  return useSetTimeline(() => session, { live }).cards.value.map((c) => c.state)
}

test('live: 完了済みの次の 1 枚だけを next に昇格させる', () => {
  expect(states(session(1, 3), true)).toEqual(['done', 'next', 'pending'])
})

test('live: 0 完了なら先頭が next', () => {
  expect(states(session(0, 3), true)).toEqual(['next', 'pending', 'pending'])
})

test('live: 全完了なら next は無く全て done', () => {
  expect(states(session(3, 3), true)).toEqual(['done', 'done', 'done'])
})

test('非 live: next を作らず done / pending の 2 状態になる', () => {
  expect(states(session(1, 3), false)).toEqual(['done', 'pending', 'pending'])
})

test('done セットは実績・メモを渡し、未実施セットは undefined を渡す', () => {
  const { cards } = useSetTimeline(() => session(1, 3), { live: false })
  expect(cards.value[0]).toMatchObject({ index: 0, setNumber: 1, actualReps: 8, memo: 'memo0' })
  expect(cards.value[1]).toMatchObject({
    index: 1,
    setNumber: 2,
    actualReps: undefined,
    memo: undefined,
  })
})

test('セッションが無ければ空配列', () => {
  expect(useSetTimeline(() => undefined, { live: true }).cards.value).toEqual([])
})
