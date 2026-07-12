import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useIntervalTimer } from '@/composables/shared/session/useIntervalTimer'

// fake timers は Date も偽装するため、deps.now は差し替えず既定の Date.now で決定的にできる
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useIntervalTimer', () => {
  test('start 直後は残り時間が設定値いっぱいで進捗 0', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    expect(timer.remainingMs.value).toBe(90_000)
    expect(timer.overrunMs.value).toBe(0)
    expect(timer.progress.value).toBe(0)
  })

  test('経過に応じて残り時間が減り進捗が増える', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    vi.advanceTimersByTime(30_000)
    expect(timer.remainingMs.value).toBe(60_000)
    expect(timer.progress.value).toBeCloseTo(1 / 3)
  })

  test('0 秒到達後は残り 0 のままカウントを止めず超過分を返す', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    vi.advanceTimersByTime(102_450)
    expect(timer.remainingMs.value).toBe(0)
    expect(timer.overrunMs.value).toBe(12_450)
    expect(timer.progress.value).toBe(1)
  })

  test('超過は 180 秒で頭打ちになり以降の時間経過が反映されない', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    vi.advanceTimersByTime(90_000 + 180_000)
    expect(timer.overrunMs.value).toBe(180_000)
    // 上限到達で tick が止まり +3:00 のまま固定
    vi.advanceTimersByTime(60_000)
    expect(timer.overrunMs.value).toBe(180_000)
  })

  test('stop で以降の時間経過が反映されない（手動停止）', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    vi.advanceTimersByTime(10_000)
    timer.stop()
    vi.advanceTimersByTime(30_000)
    expect(timer.remainingMs.value).toBe(80_000)
  })

  test('start をやり直すと前のカウントを破棄して最初から数える', () => {
    const timer = useIntervalTimer()
    timer.start(90)
    vi.advanceTimersByTime(50_000)
    timer.start(60)
    expect(timer.remainingMs.value).toBe(60_000)
    vi.advanceTimersByTime(10_000)
    expect(timer.remainingMs.value).toBe(50_000)
  })

  test('duration 0 は開始時点で 0 秒到達済み扱いになる（進捗 1・即超過）', () => {
    const timer = useIntervalTimer()
    timer.start(0)
    expect(timer.remainingMs.value).toBe(0)
    expect(timer.progress.value).toBe(1)
    vi.advanceTimersByTime(5_000)
    expect(timer.overrunMs.value).toBe(5_000)
  })

  test('スコープ破棄でタイマーを解放し以降の時間経過が反映されない', () => {
    const scope = effectScope()
    const timer = scope.run(() => useIntervalTimer())
    if (!timer) throw new Error('scope.run が composable を返さなかった')
    timer.start(90)
    vi.advanceTimersByTime(10_000)
    scope.stop()
    vi.advanceTimersByTime(30_000)
    expect(timer.remainingMs.value).toBe(80_000)
  })
})
