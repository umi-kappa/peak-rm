import { expect, test } from 'vitest'

import { formatDeltaBadge } from '@/core/deltaBadge'

test('増加は + 符号・1 桁・arrow-up を返す', () => {
  expect(formatDeltaBadge(3)).toEqual({ text: '+3.0', icon: 'arrow-up' })
})

test('減少は − 符号（U+2212）・1 桁・arrow-down を返す', () => {
  expect(formatDeltaBadge(-2.5)).toEqual({ text: '−2.5', icon: 'arrow-down' })
})

test('差 0 は矢印なしの ±0.0 を返す', () => {
  expect(formatDeltaBadge(0)).toEqual({ text: '±0.0', icon: undefined })
})

test('比較不能（undefined）はそのまま undefined を返す', () => {
  expect(formatDeltaBadge(undefined)).toBeUndefined()
})
