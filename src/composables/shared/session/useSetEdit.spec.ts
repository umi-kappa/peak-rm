import { expect, test, vi } from 'vitest'

import { useSetEdit } from '@/composables/shared/session/useSetEdit'
import { EXERCISE_LABELS } from '@/core/constants'
import type { ReadonlySession, SetResult } from '@/core/types'

function session(results: SetResult[]): ReadonlySession {
  return {
    id: 's',
    exercise: 'benchPress',
    status: 'aborted',
    startedAt: 0,
    menu: { exercise: 'benchPress', weight: 100, reps: 8, sets: 3, intervalSec: 90 },
    results,
  }
}

const done = session([
  { actualReps: 8, memo: 'first' },
  { actualReps: 7, memo: '' },
])

test('open 前は editingSet が undefined（モーダル非表示）', () => {
  const { editingSet } = useSetEdit(() => done, vi.fn())
  expect(editingSet.value).toBeUndefined()
})

test('openSetEdit で対象セットからモーダルの値を導出する', () => {
  const { editingSet, openSetEdit } = useSetEdit(() => done, vi.fn())
  openSetEdit(1)
  expect(editingSet.value).toEqual({
    exerciseLabel: EXERCISE_LABELS.benchPress,
    weight: 100,
    setNumber: 2,
    actualReps: 7,
    memo: '',
  })
})

test('範囲外 index を開いても editingSet は undefined', () => {
  const { editingSet, openSetEdit } = useSetEdit(() => done, vi.fn())
  openSetEdit(5)
  expect(editingSet.value).toBeUndefined()
})

test('セッションが無ければ open しても editingSet は undefined', () => {
  const { editingSet, openSetEdit } = useSetEdit(() => undefined, vi.fn())
  openSetEdit(0)
  expect(editingSet.value).toBeUndefined()
})

test('closeSetEdit で editingSet を閉じる', () => {
  const { editingSet, openSetEdit, closeSetEdit } = useSetEdit(() => done, vi.fn())
  openSetEdit(0)
  closeSetEdit()
  expect(editingSet.value).toBeUndefined()
})

test('saveSetEdit は対象 index で save を呼び、保存後に閉じる', async () => {
  const save = vi.fn(async () => {})
  const { editingSet, openSetEdit, saveSetEdit } = useSetEdit(() => done, save)
  openSetEdit(1)
  const result: SetResult = { actualReps: 9, memo: 'updated' }
  await saveSetEdit(result)
  expect(save).toHaveBeenCalledWith(1, result)
  expect(editingSet.value).toBeUndefined()
})

test('open していないときの saveSetEdit は save を呼ばない', async () => {
  const save = vi.fn(async () => {})
  const { saveSetEdit } = useSetEdit(() => done, save)
  await saveSetEdit({ actualReps: 9, memo: '' })
  expect(save).not.toHaveBeenCalled()
})
