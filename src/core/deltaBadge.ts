/** 前回比バッジの表示値。text = 整形済み差分、icon = 増減の矢印（表示上 0 は矢印なし） */
export type DeltaBadge = { text: string; icon: 'arrow-up' | 'arrow-down' | undefined }

/**
 * 推定 1RM の差分を前回比バッジへ整形する。差分の意味は呼び出し側が決める
 * （結果確認画面は直前の完遂セッションとの差、履歴の 1RM グラフは表示区間の「終点 − 始点」）。
 * 比較不能（前回無し・当日 1RM が 0・点が 1 つのみ）は呼び出し側が undefined を渡し、そのまま undefined を返す。
 * 表示上 0 は矢印なしの ±0.0、増減は符号（+ / −）付きの 1 桁と上下矢印（design には増減の 2 例のみ）。
 */
export function formatDeltaBadge(delta: number | undefined): DeltaBadge | undefined {
  if (delta === undefined) return undefined
  // 推定 1RM は小数 1 桁で表示するため、両端が同じ表示値になる微差は増減なしとして扱う
  // （丸め前の符号で判定すると、同じ値が並んでいるのに ±0.0 へ矢印が付く）
  const rounded = Number(delta.toFixed(1))
  if (rounded === 0) return { text: '±0.0', icon: undefined }
  return {
    text: `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)}`,
    icon: rounded > 0 ? 'arrow-up' : 'arrow-down',
  }
}
