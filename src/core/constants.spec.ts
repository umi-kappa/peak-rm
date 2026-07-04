import { describe, expect, test } from 'vitest'

import { isExercise } from '@/core/constants'

describe('isExercise', () => {
  test('定義済みの全種目を Exercise と判定する', () => {
    expect(isExercise('benchPress')).toBe(true)
    expect(isExercise('squat')).toBe(true)
    expect(isExercise('deadlift')).toBe(true)
  })

  test('未知の文字列・空文字は Exercise ではない', () => {
    expect(isExercise('running')).toBe(false)
    expect(isExercise('BENCHPRESS')).toBe(false)
    expect(isExercise('')).toBe(false)
  })
})
