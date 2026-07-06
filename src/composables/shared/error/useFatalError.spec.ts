import { expect, test } from 'vitest'

import { useFatalError } from '@/composables/shared/error/useFatalError'

test('report したエラーが error に反映される', () => {
  const { error, report } = useFatalError()
  expect(error.value).toBeUndefined()
  const cause = new Error('boom')
  report(cause)
  expect(error.value).toBe(cause)
})

test('2 回目以降の report は最初のエラーを上書きしない', () => {
  const { error, report } = useFatalError()
  const first = new Error('first')
  report(first)
  report(new Error('second'))
  expect(error.value).toBe(first)
})

test('Error 以外の値の report は Error に正規化して保持する', () => {
  const { error, report } = useFatalError()
  report('boom')
  expect(error.value).toBeInstanceOf(Error)
  expect(error.value?.message).toBe('boom')
})

test('値なし（undefined）の report も「エラーなし」と区別して保持する', () => {
  const { error, report } = useFatalError()
  report(undefined)
  expect(error.value).toBeInstanceOf(Error)
})
