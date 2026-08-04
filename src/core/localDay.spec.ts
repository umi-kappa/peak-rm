import { expect, test } from 'vitest'

import { formatLocalDay, formatLocalMonthDay } from '@/core/localDay'

// ローカル日付の構成要素から timestamp を作り、CI の TZ に依存しないようにする。
// アサーション自体はどの TZ でも通るが、UTC 実装（toISOString）への退化を検出する力は
// 固定 TZ の UTC+9 に依存する。ずれるのはローカル 0〜8 時だけなので、その検出は
// 0 時のケースが担う。
test('formatLocalDay はローカル日付を YYYY/MM/DD にする（月日はゼロ詰め・日境界はローカル基準）', () => {
  expect(formatLocalDay(new Date(2026, 0, 1, 9, 0).getTime())).toBe('2026/01/01')
  expect(formatLocalDay(new Date(2026, 0, 1, 23, 59).getTime())).toBe('2026/01/01')
  expect(formatLocalDay(new Date(2026, 0, 2, 0, 0).getTime())).toBe('2026/01/02')
})

test('formatLocalMonthDay は年を落として MM/DD にする（1 桁はゼロ詰め・2 桁はそのまま・日境界はローカル基準）', () => {
  expect(formatLocalMonthDay(new Date(2026, 0, 1, 9, 0).getTime())).toBe('01/01')
  expect(formatLocalMonthDay(new Date(2026, 11, 25, 9, 0).getTime())).toBe('12/25')
  expect(formatLocalMonthDay(new Date(2026, 0, 2, 0, 0).getTime())).toBe('01/02')
})
