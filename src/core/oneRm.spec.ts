import { describe, expect, test } from 'vitest'

import { estimateOneRm } from '@/core/oneRm'

describe('estimateOneRm', () => {
  test('ベンチプレスは w × (1 + r / 40) で計算する', () => {
    expect(estimateOneRm('benchPress', 100, 8)).toBe(120)
    expect(estimateOneRm('benchPress', 100, 5)).toBe(112.5)
  })

  test('スクワットは w × (1 + r / 33.3) で計算する', () => {
    expect(estimateOneRm('squat', 100, 8)).toBeCloseTo(100 * (1 + 8 / 33.3))
  })

  test('デッドリフトはスクワットと同じ係数で計算する', () => {
    expect(estimateOneRm('deadlift', 100, 8)).toBeCloseTo(100 * (1 + 8 / 33.3))
  })

  test('実績 0 回（スキップ）は 1RM 計算から除外して 0 を返す', () => {
    expect(estimateOneRm('benchPress', 100, 0)).toBe(0)
  })

  test('reps が負でも 0 を返す', () => {
    expect(estimateOneRm('squat', 100, -1)).toBe(0)
  })

  test('有効レンジ（12）を超える reps も例外を投げず計算する', () => {
    expect(estimateOneRm('benchPress', 100, 15)).toBe(100 * (1 + 15 / 40))
  })
})
