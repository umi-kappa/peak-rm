export type StepperOptions = {
  // 増減の刻み幅。省略時は 1
  step?: number
  min?: number
  max?: number
}

/**
 * value を min〜max の範囲に丸める。省略した境界は無制限。
 * NaN は数値として壊れた入力なので下限（min、無ければ 0）へ置き換え、そのうえで同じ経路で丸める
 * （max も適用される）。
 */
export function clamp(value: number, min?: number, max?: number): number {
  const safeValue = Number.isNaN(value) ? (min ?? 0) : value
  const lower = min ?? -Infinity
  const upper = max ?? Infinity
  return Math.min(Math.max(safeValue, lower), upper)
}

/**
 * value + step を min〜max に clamp した値を返す。step 省略時は 1。
 * step 跨ぎで max を超える場合は max で止まる（部分 step を許容）。
 * step 非整列の value は整列させない（整列は呼び出し側の責務）。
 * 実利用の step（0.25 / 1 / 10）は 2 進で正確なため浮動小数点補正は行わない。
 */
export function increment(value: number, { step = 1, min, max }: StepperOptions = {}): number {
  return clamp(value + step, min, max)
}

/**
 * value - step を min〜max に clamp した値を返す。制約は increment と同じ。
 */
export function decrement(value: number, { step = 1, min, max }: StepperOptions = {}): number {
  return clamp(value - step, min, max)
}
