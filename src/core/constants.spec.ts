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

  // route query は string | string[] | undefined を取り得る（配列は ?exercise=a&exercise=b）
  test('文字列でない値も Exercise ではない（配列 query・値なし）', () => {
    expect(isExercise(['squat'])).toBe(false)
    expect(isExercise(undefined)).toBe(false)
  })
})
