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

test('値なし（undefined）の report は「エラーなし」と区別して Unknown error に正規化する', () => {
  const { error, report } = useFatalError()
  report(undefined)
  expect(error.value).toBeInstanceOf(Error)
  expect(error.value?.message).toBe('Unknown error')
})

test('空文字・無情報なオブジェクトの report は Unknown error に落とす', () => {
  const empty = useFatalError()
  empty.report('')
  expect(empty.error.value?.message).toBe('Unknown error')

  const object = useFatalError()
  object.report({ code: 500 })
  expect(object.error.value?.message).toBe('Unknown error')
})
