import { onScopeDispose, ref, type Ref } from 'vue'
import { increment, decrement, type StepperOptions } from '@/core/stepper'

// 長押し判定までの待ち時間
export const NUMBER_STEPPER_REPEAT_DELAY_MS = 500
// 長押し中のリピート間隔
export const NUMBER_STEPPER_REPEAT_INTERVAL_MS = 100

/**
 * ステッパーの増減操作と長押しリピートを提供する。
 * startIncrement / startDecrement は pointerdown ハンドラとして使い、即 1 step 適用したうえで
 * NUMBER_STEPPER_REPEAT_DELAY_MS 経過後から NUMBER_STEPPER_REPEAT_INTERVAL_MS 間隔でリピートする。
 * stepUp / stepDown は keydown 用の一段適用。リピートは持たず、押しっぱなしは OS のキーリピートに任せる。
 * pointerdown 時に pointer capture を取得するため、ボタン外で離しても pointerup / pointercancel がボタンへ届き確実に stop できる。
 * min / max 到達後はタイマーを止めず clamp による no-op を続ける。
 * options は step / min / max を持つ ref（computed）で渡す。apply ごとに .value を読むため、props 変更が次の操作に反映される。
 */
export function useNumberStepper(value: Ref<number>, options: Ref<StepperOptions> = ref({})) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let intervalId: ReturnType<typeof setInterval> | undefined

  function apply(direction: 1 | -1) {
    const opts = options.value
    value.value = direction === 1 ? increment(value.value, opts) : decrement(value.value, opts)
  }

  function start(event: PointerEvent, direction: 1 | -1) {
    // 主ボタン（タッチ / ペン / 左クリック = button 0）以外は無視する。右クリック等で stray step が入るのを防ぐ
    if (event.button !== 0) {
      return
    }
    // pointer capture を取得し、押下後にボタン外で離しても pointerup / pointercancel がこのボタンへ届くようにする
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
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

  onScopeDispose(stop)

  return {
    startIncrement: (event: PointerEvent) => start(event, 1),
    startDecrement: (event: PointerEvent) => start(event, -1),
    stepUp: () => apply(1),
    stepDown: () => apply(-1),
    stop,
  }
}
