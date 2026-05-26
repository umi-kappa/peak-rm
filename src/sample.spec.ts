import { describe, expect, test } from 'vitest'

const sum = (a: number, b: number): number => a + b

describe('vitest setup', () => {
  test('sum は 2 つの数値の和を返す', () => {
    expect(sum(1, 2)).toBe(3)
  })
})
