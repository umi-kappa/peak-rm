import { describe, expect, test } from 'vitest'
import { clamp, decrement, increment } from '@/core/stepper'

describe('increment', () => {
  test('step 分だけ加算する（1 / 0.25 / 10 の各刻み）', () => {
    expect(increment(8, { step: 1 })).toBe(9)
    expect(increment(40, { step: 0.25 })).toBe(40.25)
    expect(increment(90, { step: 10 })).toBe(100)
  })

  test('step で max を跨ぐときは max で止まる（部分 step を許容し clamp を通す）', () => {
    expect(increment(11.5, { step: 1, max: 12 })).toBe(12)
  })

  test('step 省略時は 1 刻みで加算する', () => {
    expect(increment(8)).toBe(9)
  })
})

describe('decrement', () => {
  test('step 分だけ減算する', () => {
    expect(decrement(8, { step: 1 })).toBe(7)
    expect(decrement(90, { step: 10 })).toBe(80)
  })

  test('step で min を跨ぐときは min で止まる（部分 step を許容し clamp を通す）', () => {
    expect(decrement(0.5, { step: 1, min: 0 })).toBe(0)
  })

  test('step 省略時は 1 刻みで減算する', () => {
    expect(decrement(8)).toBe(7)
  })
})

describe('clamp', () => {
  test('範囲内の値はそのまま返す', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  test('min 未満は min に、max 超は max に丸める', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  test('min / max ちょうどの境界値はそのまま返す（閉区間）', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  test('min / max 省略時はそのまま返す', () => {
    expect(clamp(-100)).toBe(-100)
    expect(clamp(100, 0)).toBe(100)
    expect(clamp(-100, undefined, 10)).toBe(-100)
  })
})

describe('0.25 刻みの重量', () => {
  test('0.25 刻みで加減しても浮動小数点誤差が出ない', () => {
    let value = 40
    for (let index = 0; index < 10; index += 1) {
      value = increment(value, { step: 0.25 })
    }
    expect(value).toBe(42.5)
    for (let index = 0; index < 4; index += 1) {
      value = decrement(value, { step: 0.25 })
    }
    expect(value).toBe(41.5)
  })
})
