/** 前回比バッジの表示値。text = 整形済み差分、icon = 増減の矢印（差 0 は矢印なし） */
export type DeltaBadge = { text: string; icon: 'arrow-up' | 'arrow-down' | undefined }

/**
 * 前回の完遂セッションとの推定 1RM 差分を前回比バッジへ整形する。
 * 比較不能（前回無し・当日 1RM が 0）は呼び出し側が undefined を渡し、そのまま undefined を返す。
 * 差 0 は矢印なしの ±0.0、増減は符号（+ / −）付きの 1 桁と上下矢印（design には増減の 2 例のみ）。
 */
export function formatDeltaBadge(delta: number | undefined): DeltaBadge | undefined {
  if (delta === undefined) return undefined
  if (delta === 0) return { text: '±0.0', icon: undefined }
  return {
    text: `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`,
    icon: delta > 0 ? 'arrow-up' : 'arrow-down',
  }
}
