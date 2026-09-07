import { onScopeDispose, ref, type Ref } from 'vue'
import { increment, decrement, type StepperOptions } from '@/core/stepper'

// 長押し判定までの待ち時間
export const NUMBER_STEPPER_REPEAT_DELAY_MS = 500
// 長押し中のリピート間隔
export const NUMBER_STEPPER_REPEAT_INTERVAL_MS = 100
// 加速に入るまでの等速リピート回数。等速リピートが 1 秒続いた次の tick から加速する
//（長押し開始からは NUMBER_STEPPER_REPEAT_DELAY_MS + 11 tick = 1.6 秒）
export const NUMBER_STEPPER_ACCELERATE_AFTER_TICKS = 10
// 加速後に 1 回のリピートで進める step 数
export const NUMBER_STEPPER_ACCELERATED_STEPS = 4

/**
 * ステッパーの増減操作と長押しリピートを提供する。
 * startIncrement / startDecrement は pointerdown ハンドラとして使い、即 1 step 適用したうえで
 * NUMBER_STEPPER_REPEAT_DELAY_MS 経過後から NUMBER_STEPPER_REPEAT_INTERVAL_MS 間隔でリピートする。
 * リピートが NUMBER_STEPPER_ACCELERATE_AFTER_TICKS 回続いたら 1 回あたり NUMBER_STEPPER_ACCELERATED_STEPS step
 * 進めて加速する（0.25 kg 刻みの重量を 40 → 100 kg にするような大きな移動を数秒で済ませるため）。
 * 加速は step を大きくするのではなく 1 step の適用を繰り返すため、刻み幅と clamp の規則は core/stepper のまま。
 * stepUp / stepDown は keydown 用の一段適用。リピートは持たず、押しっぱなしは OS のキーリピートに任せる。
 * pointerdown 時に pointer capture を取得するため、ボタン外で離しても pointerup / pointercancel がボタンへ届き確実に stop できる。
 * min / max 到達後はタイマーを止めず clamp による no-op を続ける。
 * options は step / min / max を持つ ref（computed）で渡す。apply ごとに .value を読むため、props 変更が次の操作に反映される。
 */
export function useNumberStepper(value: Ref<number>, options: Ref<StepperOptions> = ref({})) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let intervalId: ReturnType<typeof setInterval> | undefined

  function apply(direction: 1 | -1, steps = 1) {
    const opts = options.value
    let next = value.value
    for (let i = 0; i < steps; i++) {
      next = direction === 1 ? increment(next, opts) : decrement(next, opts)
    }
    value.value = next
  }

  function repeat(direction: 1 | -1) {
    let ticks = 0
    intervalId = setInterval(() => {
      ticks++
      apply(
        direction,
        ticks > NUMBER_STEPPER_ACCELERATE_AFTER_TICKS ? NUMBER_STEPPER_ACCELERATED_STEPS : 1,
      )
    }, NUMBER_STEPPER_REPEAT_INTERVAL_MS)
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
    timeoutId = setTimeout(() => repeat(direction), NUMBER_STEPPER_REPEAT_DELAY_MS)
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
