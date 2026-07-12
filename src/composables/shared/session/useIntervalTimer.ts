import { computed, onScopeDispose, ref, type InjectionKey } from 'vue'

// カウント更新の tick 間隔。センチ秒表示（例: .32）が滑らかに見える粒度にする
export const INTERVAL_TIMER_TICK_MS = 50
// 超過表示の上限秒数。到達後はカウントを進めず +3:00 のまま固定する（spec「インターバルタイマー」）
export const INTERVAL_TIMER_OVERRUN_CAP_SEC = 180

export type IntervalTimerDeps = { now?: () => number }

// interval ページが inject する deps の注入キー。stories はここに固定時計を provide して
// タイマー表示を凍結し、snapshot を決定的にする。未 provide なら実時計で動く
export const intervalTimerDepsInjectionKey: InjectionKey<IntervalTimerDeps> =
  Symbol('intervalTimerDeps')

/**
 * インターバルのカウントダウンと、0 秒到達後の超過カウント（overrunMs）を提供するタイマー。
 *
 * - 残り時間は tick の積算ではなく「start 時刻からの経過」で毎回計算する。
 *   タブ非活性などで tick が間引かれても表示がずれないようにするため
 * - 0 秒到達では止まらない。止まるのは超過上限（+3:00 到達）・stop()・スコープ破棄の 3 つだけ
 * - deps.now は現在時刻の取得口。テストや stories が固定時計を渡すと決定的に動かせる
 */
export function useIntervalTimer(deps: IntervalTimerDeps = {}) {
  const now = deps.now ?? (() => Date.now())

  const durationMs = ref(0)
  const startedAt = ref(0)
  const nowMs = ref(0)
  let intervalId: ReturnType<typeof setInterval> | undefined

  const elapsedMs = computed(() => nowMs.value - startedAt.value)
  const remainingMs = computed(() => Math.max(durationMs.value - elapsedMs.value, 0))
  const overrunMs = computed(() => Math.max(elapsedMs.value - durationMs.value, 0))
  // 経過割合（0〜1）。duration 0 は開始時点で 0 秒到達済みなので 1 とする
  const progress = computed(() =>
    durationMs.value > 0 ? Math.min(elapsedMs.value / durationMs.value, 1) : 1,
  )

  function tick() {
    const capMs = durationMs.value + INTERVAL_TIMER_OVERRUN_CAP_SEC * 1000
    const elapsed = now() - startedAt.value
    if (elapsed >= capMs) {
      // 超過上限に到達。実際の経過は上限を超えているので、nowMs を上限ちょうどに合わせてから
      // tick を止め、以降は +3:00 の表示のまま凍結する
      nowMs.value = startedAt.value + capMs
      stop()
      return
    }
    nowMs.value = startedAt.value + elapsed
  }

  function start(durationSec: number) {
    stop()
    durationMs.value = durationSec * 1000
    startedAt.value = now()
    nowMs.value = startedAt.value
    intervalId = setInterval(tick, INTERVAL_TIMER_TICK_MS)
  }

  function stop() {
    clearInterval(intervalId)
    intervalId = undefined
  }

  onScopeDispose(stop)

  return {
    remainingMs,
    overrunMs,
    progress,
    start,
    stop,
  }
}
