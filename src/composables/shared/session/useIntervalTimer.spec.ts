import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  type IntervalTimerDeps,
  useIntervalTimer,
} from '@/composables/shared/session/useIntervalTimer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// deps を省略すると fake timers が Date も偽装するため、既定の Date.now のままで決定的に動く。
// tick 間隔より大きく時刻が飛ぶ状況を作るテストだけ now を注入する
function setup(deps?: IntervalTimerDeps) {
  const scope = effectScope()
  const timer = scope.run(() => useIntervalTimer(deps))
  if (!timer) throw new Error('effectScope.run が undefined を返しました')
  return { scope, ...timer }
}

describe('useIntervalTimer', () => {
  test('tick 回数ではなく実時刻から残り時間を導出する', () => {
    let nowMs = 0
    const timer = setup({ now: () => nowMs })
    timer.start(60)

    nowMs = 30_000
    vi.advanceTimersByTime(50)

    expect(timer.remainingMs.value).toBe(30_000)
    expect(timer.progress.value).toBe(0.5)
  })

  test('1 tick で 0 秒到達を跨いでも超過分を返す', () => {
    let nowMs = 0
    const timer = setup({ now: () => nowMs })
    timer.start(1)

    nowMs = 5_000
    vi.advanceTimersByTime(50)

    expect(timer.remainingMs.value).toBe(0)
    expect(timer.overrunMs.value).toBe(4_000)
    expect(timer.reachedZero.value).toBe(true)
  })

  test('start 直後は残り時間が設定値いっぱいで進捗 0', () => {
    const timer = setup()
    timer.start(90)
    expect(timer.remainingMs.value).toBe(90_000)
    expect(timer.overrunMs.value).toBe(0)
    expect(timer.progress.value).toBe(0)
  })

  test('経過に応じて残り時間が減り進捗が増える', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(30_000)
    expect(timer.remainingMs.value).toBe(60_000)
    expect(timer.progress.value).toBeCloseTo(1 / 3)
  })

  test('0 秒到達後は残り 0 のままカウントを止めず超過分を返す', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(102_450)
    expect(timer.remainingMs.value).toBe(0)
    expect(timer.overrunMs.value).toBe(12_450)
    expect(timer.progress.value).toBe(1)
  })

  test('超過は 180 秒で頭打ちになり以降の時間経過が反映されない', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(90_000 + 180_000)
    expect(timer.overrunMs.value).toBe(180_000)
    // 上限到達で tick が止まり +3:00 のまま固定
    vi.advanceTimersByTime(60_000)
    expect(timer.overrunMs.value).toBe(180_000)
  })

  test('上限を跨ぐ 1 tick でも超過は 180 秒で頭打ちになる', () => {
    let nowMs = 0
    const timer = setup({ now: () => nowMs })
    timer.start(90)

    nowMs = 90_000 + 200_000
    vi.advanceTimersByTime(50)

    expect(timer.overrunMs.value).toBe(180_000)
  })

  test('reachedZero は 0 秒到達から超過上限までの区間だけ真になる', () => {
    const timer = setup()
    // start 前は残り時間も 0 だが、まだ到達していない
    expect(timer.reachedZero.value).toBe(false)
    timer.start(90)
    expect(timer.reachedZero.value).toBe(false)
    vi.advanceTimersByTime(90_000)
    expect(timer.reachedZero.value).toBe(true)
    vi.advanceTimersByTime(180_000)
    expect(timer.reachedZero.value).toBe(false)
  })

  test('start をやり直すと前のカウントを破棄して最初から数える', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(50_000)
    timer.start(60)
    expect(timer.remainingMs.value).toBe(60_000)
    vi.advanceTimersByTime(10_000)
    expect(timer.remainingMs.value).toBe(50_000)
  })

  test('start をやり直しても稼働タイマーは 1 本で、スコープ破棄で 0 本になる', () => {
    const timer = setup()
    timer.start(90)
    timer.start(60)
    expect(vi.getTimerCount()).toBe(1)
    timer.scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('duration 0 は開始時点で 0 秒到達済み扱いになる（進捗 1・即超過）', () => {
    const timer = setup()
    timer.start(0)
    expect(timer.remainingMs.value).toBe(0)
    expect(timer.progress.value).toBe(1)
    vi.advanceTimersByTime(5_000)
    expect(timer.overrunMs.value).toBe(5_000)
  })

  test('スコープ破棄でタイマーを解放し以降の時間経過が反映されない', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(10_000)
    timer.scope.stop()
    vi.advanceTimersByTime(30_000)
    expect(timer.remainingMs.value).toBe(80_000)
  })

  test('スコープ破棄後は 0 秒到達済みでも reachedZero が落ちる', () => {
    const timer = setup()
    timer.start(90)
    vi.advanceTimersByTime(90_000)
    expect(timer.reachedZero.value).toBe(true)
    timer.scope.stop()
    expect(timer.reachedZero.value).toBe(false)
  })
})
