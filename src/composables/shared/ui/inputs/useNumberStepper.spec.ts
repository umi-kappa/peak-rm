import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import type { StepperOptions } from '@/core/stepper'
import {
  NUMBER_STEPPER_ACCELERATE_AFTER_TICKS,
  NUMBER_STEPPER_ACCELERATED_STEPS,
  NUMBER_STEPPER_REPEAT_DELAY_MS,
  NUMBER_STEPPER_REPEAT_INTERVAL_MS,
  useNumberStepper,
} from '@/composables/shared/ui/inputs/useNumberStepper'

// 長押し判定から加速に入る直前（等速リピートを NUMBER_STEPPER_ACCELERATE_AFTER_TICKS 回終えた時点）までの時間
const UNTIL_ACCELERATION_MS =
  NUMBER_STEPPER_REPEAT_DELAY_MS +
  NUMBER_STEPPER_REPEAT_INTERVAL_MS * NUMBER_STEPPER_ACCELERATE_AFTER_TICKS

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const POINTER_ID = 1

// startIncrement / startDecrement は pointerdown ハンドラとして PointerEvent を受け取り capture を取得するため、
// タイマーロジックの検証では setPointerCapture を持つ最小限のスタブイベントを注入する
function pointerDown(button = 0, setPointerCapture: (pointerId: number) => void = () => {}) {
  return {
    button,
    currentTarget: { setPointerCapture },
    pointerId: POINTER_ID,
  } as unknown as PointerEvent
}

function setup(initial: number, options?: Parameters<typeof useNumberStepper>[1]) {
  const scope = effectScope()
  const value = ref(initial)
  const stepper = scope.run(() => useNumberStepper(value, options))
  if (!stepper) throw new Error('effectScope.run が undefined を返しました')
  const { startIncrement, startDecrement, stepUp, stepDown, stop } = stepper
  return {
    scope,
    value,
    startIncrement: (button?: number, setPointerCapture?: (pointerId: number) => void) =>
      startIncrement(pointerDown(button, setPointerCapture)),
    startDecrement: (button?: number) => startDecrement(pointerDown(button)),
    stepUp,
    stepDown,
    stop,
  }
}

describe('useNumberStepper', () => {
  // 長押しの体感（design「Stepper」の 0.5 s / 100 ms / 1 s で 4 刻み）は定数そのものが決めるため、
  // 実値を直接固定する。他のテストは定数から期待値を導出するので、値を変えても気付けない
  test('長押しリピートの定数は design で決めた実値になっている', () => {
    expect(NUMBER_STEPPER_REPEAT_DELAY_MS).toBe(500)
    expect(NUMBER_STEPPER_REPEAT_INTERVAL_MS).toBe(100)
    expect(NUMBER_STEPPER_ACCELERATE_AFTER_TICKS).toBe(10)
    expect(NUMBER_STEPPER_ACCELERATED_STEPS).toBe(4)
  })

  test('pointerdown で pointer capture を取得する', () => {
    const setPointerCapture = vi.fn()
    const { startIncrement } = setup(8)

    startIncrement(0, setPointerCapture)

    expect(setPointerCapture).toHaveBeenCalledWith(POINTER_ID)
  })

  test('startIncrement で即座に 1 step 増える', () => {
    const { value, startIncrement } = setup(8)
    startIncrement()
    expect(value.value).toBe(9)
  })

  test('startDecrement で即座に 1 step 減る', () => {
    const { value, startDecrement } = setup(8, ref({ step: 10 }))
    startDecrement()
    expect(value.value).toBe(-2)
  })

  test('stepUp は 1 step 増やすだけでリピートを始めない', () => {
    const { value, stepUp } = setup(8)
    stepUp()
    expect(value.value).toBe(9)
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(9)
  })

  test('stepDown は 1 step 減らすだけでリピートを始めない', () => {
    const { value, stepDown } = setup(8)
    stepDown()
    expect(value.value).toBe(7)
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(7)
  })

  test('長押し判定前に stop すると 1 step のみで止まる', () => {
    const { value, startIncrement, stop } = setup(8)
    startIncrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS - 1)
    stop()
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(9)
  })

  test('長押しすると NUMBER_STEPPER_REPEAT_DELAY_MS 経過後から NUMBER_STEPPER_REPEAT_INTERVAL_MS 間隔でリピートする', () => {
    const { value, startIncrement } = setup(0)
    startIncrement()
    expect(value.value).toBe(1)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS)
    expect(value.value).toBe(1)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    expect(value.value).toBe(2)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_INTERVAL_MS * 3)
    expect(value.value).toBe(5)
  })

  test('リピート中に stop すると止まる', () => {
    const { value, startIncrement, stop } = setup(0)
    startIncrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 2)
    expect(value.value).toBe(3)
    stop()
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(3)
  })

  test('リピートが NUMBER_STEPPER_ACCELERATE_AFTER_TICKS 回続いたら 1 回あたり NUMBER_STEPPER_ACCELERATED_STEPS step 進む', () => {
    const { value, startIncrement } = setup(0)
    startIncrement()
    vi.advanceTimersByTime(UNTIL_ACCELERATION_MS)
    expect(value.value).toBe(1 + NUMBER_STEPPER_ACCELERATE_AFTER_TICKS)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    expect(value.value).toBe(
      1 + NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + NUMBER_STEPPER_ACCELERATED_STEPS,
    )
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_INTERVAL_MS * 2)
    expect(value.value).toBe(
      1 + NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + NUMBER_STEPPER_ACCELERATED_STEPS * 3,
    )
  })

  test('加速しても step の刻み幅は変わらない', () => {
    const { value, startIncrement } = setup(40, ref({ step: 0.25 }))
    startIncrement()
    vi.advanceTimersByTime(UNTIL_ACCELERATION_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    expect(value.value).toBe(
      40 + 0.25 * (1 + NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + NUMBER_STEPPER_ACCELERATED_STEPS),
    )
  })

  test('加速後も max を上回らない', () => {
    const { value, startIncrement } = setup(
      0,
      ref({ step: 1, max: NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + 2 }),
    )
    startIncrement()
    vi.advanceTimersByTime(UNTIL_ACCELERATION_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 3)
    expect(value.value).toBe(NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + 2)
  })

  test('加速後も min を下回らない', () => {
    const { value, startDecrement } = setup(
      NUMBER_STEPPER_ACCELERATE_AFTER_TICKS + 2,
      ref({ step: 1, min: 0 }),
    )
    startDecrement()
    vi.advanceTimersByTime(UNTIL_ACCELERATION_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 3)
    expect(value.value).toBe(0)
  })

  test('離して押し直すと等速リピートからやり直す', () => {
    const { value, startIncrement, stop } = setup(0)
    startIncrement()
    vi.advanceTimersByTime(UNTIL_ACCELERATION_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    stop()
    const accelerated = value.value
    startIncrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    expect(value.value).toBe(accelerated + 2)
  })

  test('start を連続で呼んでも多重リピートしない', () => {
    const { value, startIncrement } = setup(0)
    startIncrement()
    startIncrement()
    expect(value.value).toBe(2)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    expect(value.value).toBe(3)
  })

  test('主ボタン以外（右クリック等）では増減もリピートもしない', () => {
    const { value, startIncrement } = setup(8)
    startIncrement(2)
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 3)
    expect(value.value).toBe(8)
  })

  test('min に到達したら長押し中も min を下回らない', () => {
    const { value, startDecrement } = setup(2, ref({ step: 1, min: 0 }))
    startDecrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 5)
    expect(value.value).toBe(0)
  })

  test('max に到達したら長押し中も max を上回らない', () => {
    const { value, startIncrement } = setup(10, ref({ step: 1, max: 12 }))
    startIncrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 5)
    expect(value.value).toBe(12)
  })

  test('options の ref を更新すると次の操作に最新値が反映される', () => {
    const optionsRef = ref<StepperOptions>({ step: 1 })
    const { value, startIncrement } = setup(0, optionsRef)
    startIncrement()
    expect(value.value).toBe(1)
    optionsRef.value = { step: 10 }
    startIncrement()
    expect(value.value).toBe(11)
  })

  test('スコープ破棄でタイマーが破棄される', () => {
    const { scope, value, startIncrement } = setup(0)
    startIncrement()
    scope.stop()
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(1)
  })

  test('リピート中にスコープ破棄するとリピートが止まる', () => {
    const { scope, value, startIncrement } = setup(0)
    startIncrement()
    vi.advanceTimersByTime(NUMBER_STEPPER_REPEAT_DELAY_MS + NUMBER_STEPPER_REPEAT_INTERVAL_MS * 2)
    expect(value.value).toBe(3)
    scope.stop()
    vi.advanceTimersByTime(10_000)
    expect(value.value).toBe(3)
  })
})
