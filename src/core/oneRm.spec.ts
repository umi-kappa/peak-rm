import { describe, expect, test } from 'vitest'

import { estimateOneRm, formatOneRm, hasOneRm } from '@/core/oneRm'

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

  test('reps = 1（有効レンジ下限）は除外せず計算する', () => {
    expect(estimateOneRm('benchPress', 100, 1)).toBe(100 * (1 + 1 / 40))
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

describe('hasOneRm', () => {
  test('0（計算対象のセットが無い）は算出できていないと判定する', () => {
    expect(hasOneRm(0)).toBe(false)
  })

  test('正の値は算出できたと判定する', () => {
    expect(hasOneRm(0.1)).toBe(true)
    expect(hasOneRm(96)).toBe(true)
  })
})

describe('formatOneRm', () => {
  test('小数 1 桁で表示する', () => {
    expect(formatOneRm(99)).toBe('99.0')
    expect(formatOneRm(100 * (1 + 8 / 33.3))).toBe('124.0')
  })

  test('0（計算対象のセットが無い）は — にする', () => {
    expect(formatOneRm(0)).toBe('—')
  })
})
