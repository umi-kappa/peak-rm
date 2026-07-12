import { expect, test } from 'vitest'

import { formatCentis, formatClock } from '@/core/duration'

test('formatClock は分:秒（秒 2 桁 0 埋め・切り捨て）にする', () => {
  expect(formatClock(90_000)).toBe('1:30')
  expect(formatClock(47_320)).toBe('0:47')
  expect(formatClock(5_999)).toBe('0:05')
  expect(formatClock(0)).toBe('0:00')
  expect(formatClock(600_000)).toBe('10:00')
})

test('formatCentis は秒未満をセンチ秒 2 桁（ドット付き・切り捨て）にする', () => {
  expect(formatCentis(47_320)).toBe('.32')
  expect(formatCentis(47_329)).toBe('.32')
  expect(formatCentis(90_000)).toBe('.00')
  expect(formatCentis(1_050)).toBe('.05')
})
