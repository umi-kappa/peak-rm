import { onScopeDispose, ref, type Ref } from 'vue'
import * as stepper from '@/core/stepper'

// 長押し判定までの待ち時間
export const NUMBER_STEPPER_REPEAT_DELAY_MS = 500
// 長押し中のリピート間隔
export const NUMBER_STEPPER_REPEAT_INTERVAL_MS = 100

/**
 * ステッパーの増減操作と長押し加速リピートを提供する。
 * start 系は即 1 step 適用し、NUMBER_STEPPER_REPEAT_DELAY_MS 経過後から NUMBER_STEPPER_REPEAT_INTERVAL_MS 間隔でリピートする。
 * min / max 到達後はタイマーを止めず clamp による no-op を続ける。
 * options は step / min / max を持つ ref（computed）で渡す。apply ごとに .value を読むため、props 変更が次の操作に反映される。
 */
export function useNumberStepper(
  value: Ref<number>,
  options: Ref<stepper.StepperOptions> = ref({}),
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let intervalId: ReturnType<typeof setInterval> | undefined

  function apply(direction: 1 | -1) {
    const opts = options.value
    value.value =
      direction === 1 ? stepper.increment(value.value, opts) : stepper.decrement(value.value, opts)
  }

  function start(direction: 1 | -1) {
    // pointerdown 連打による多重リピートを防ぐ
    stop()
    apply(direction)
    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => apply(direction), NUMBER_STEPPER_REPEAT_INTERVAL_MS)
    }, NUMBER_STEPPER_REPEAT_DELAY_MS)
  }

  function stop() {
    clearTimeout(timeoutId)
    clearInterval(intervalId)
    timeoutId = undefined
    intervalId = undefined
  }

  onScopeDispose(stop, true)

  return {
    startIncrement: () => start(1),
    startDecrement: () => start(-1),
    stop,
  }
}
