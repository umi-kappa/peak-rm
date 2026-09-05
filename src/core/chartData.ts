import { formatLocalMonthDay, localDayKey } from '@/core/localDay'
import { hasOneRm, roundOneRm } from '@/core/oneRm'
import { sessionMaxOneRm } from '@/core/session'
import type { ReadonlySession } from '@/core/types'

/** グラフに描く点数の上限（spec §8「表示仕様」の表示範囲）。日付ごと 1 点に絞った後の新しい 8 件。 */
const CHART_MAX_POINTS = 8

export type OneRmChartPoint = {
  /** その日の推定 1RM（kg） */
  oneRm: number
  /** 日付軸のラベル（MM/DD） */
  dayLabel: string
}

export type OneRmChartData = {
  /** 古い順（グラフの左 → 右）。最大 CHART_MAX_POINTS 件 */
  points: readonly OneRmChartPoint[]
  /** 表示区間の終点の推定 1RM。Est. 1RM のヘッドラインに出す */
  latest: number
  /** 表示区間の「終点 − 始点」（両端を表示桁へ丸めてから引く）。比較対象が無い（1 点のみ）ときは undefined */
  delta: number | undefined
}

/**
 * 日ごとの代表セッション（その日の startedAt 最大）を選ぶ。
 * 同日に同一種目で複数セッションを行うケースは想定していないが、起きた場合の扱いを
 * 決定論にするための規則（spec §8「データルール」）。ホーム・linear progression と同じ「直近」の基準。
 * startedAt が異なる限り入力の並び順には依存させない（呼び出し側の一覧が降順である事実に
 * 純関数を結合させない）。完全同値時の tie-break は仕様が定めていないため入力順のままにする。
 */
function latestSessionByDay(sessions: readonly ReadonlySession[]): ReadonlySession[] {
  const byDay = new Map<string, ReadonlySession>()
  for (const session of sessions) {
    const key = localDayKey(session.startedAt)
    const current = byDay.get(key)
    if (!current || current.startedAt < session.startedAt) byDay.set(key, session)
  }
  return [...byDay.values()]
}

/**
 * セッション一覧（1 種目分）を 1RM グラフの描画データへ変換する。
 * 記録が 1 点も無ければ undefined を返し、呼び出し側はカード自体を出さない。
 */
export function buildOneRmChartData(
  sessions: readonly ReadonlySession[],
): OneRmChartData | undefined {
  const points = latestSessionByDay(sessions)
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap((session) => {
      const oneRm = sessionMaxOneRm(session)
      // 推定 1RM が 0（対象セット無し = 全セットスキップ、または重量 0）の日は算出できない扱い
      // （0 は不在のセンチネル）。0 を打つと実在しない谷が描かれるため、その日は点にしない
      return hasOneRm(oneRm) ? [{ oneRm, dayLabel: formatLocalMonthDay(session.startedAt) }] : []
    })
    .slice(-CHART_MAX_POINTS)

  const last = points.at(-1)
  if (!last) return undefined

  return {
    points,
    latest: last.oneRm,
    // 表示値（roundOneRm 済み）の差にする。生値で引くとカードに並ぶ両端の表示値の差と食い違う
    delta: points.length >= 2 ? roundOneRm(last.oneRm) - roundOneRm(points[0].oneRm) : undefined,
  }
}
