import { isComplete, sessionMaxOneRm } from '@/core/session'
import type { Session } from '@/core/types'

/**
 * 同（ローカル日付 × 種目）ごとに 1 件へ集約する純関数。結果は startedAt 降順。
 * 採用優先順位（spec「1RM グラフ」節の集約規則。履歴一覧でも共通）:
 *   1. 完遂（isComplete）を未完遂より優先（後発の中断が同日の完遂記録を消さないため）
 *   2. 完遂の有無が同じなら推定 1RM が最大のもの（PeakRM はピーク強度を追跡するため、最新ではなくベスト記録を採用）
 *   3. 1RM も同値なら startedAt 最大（決定論のための最終 tie-break）
 */
export function dedupeHistoryByDay(sessions: Session[]): Session[] {
  const best = new Map<string, Session>()
  for (const session of sessions) {
    const key = `${localDayKey(session.startedAt)}:${session.exercise}`
    const current = best.get(key)
    if (current === undefined || isHigherPriority(session, current)) {
      best.set(key, session)
    }
  }
  return [...best.values()].sort((a, b) => b.startedAt - a.startedAt)
}

// 完遂を未完遂より優先 → 完遂の有無が同じなら推定 1RM 最大 → それも同値なら startedAt 最大。
function isHigherPriority(a: Session, b: Session): boolean {
  const aComplete = isComplete(a)
  const bComplete = isComplete(b)
  if (aComplete !== bComplete) return aComplete
  const aOneRm = sessionMaxOneRm(a)
  const bOneRm = sessionMaxOneRm(b)
  if (aOneRm !== bOneRm) return aOneRm > bOneRm
  return a.startedAt > b.startedAt
}

/**
 * timestamp が属するローカルカレンダー日の年月日。キーと表示ラベルの共通の土台。
 * 同一日の判定はデバイスのローカルタイムゾーン基準（UTC の toISOString は使わない）。
 * 月日をゼロ詰めするのは、ソート / 表示のどちらに流用しても破綻しない固定桁にするため。
 */
function localDayParts(timestamp: number) {
  const d = new Date(timestamp)
  return {
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  }
}

/** timestamp が属するローカルカレンダー日のキー（`2026-01-09` 形式）。 */
export function localDayKey(timestamp: number): string {
  const { year, month, day } = localDayParts(timestamp)
  return `${year}-${month}-${day}`
}

/** timestamp が属するローカルカレンダー日の表示ラベル（`2026/01/09` 形式）。 */
export function formatLocalDay(timestamp: number): string {
  const { year, month, day } = localDayParts(timestamp)
  return `${year}/${month}/${day}`
}

/** ローカルカレンダー日の月日ラベル（`01/09` 形式）。履歴一覧の行に使う。 */
export function formatLocalMonthDay(timestamp: number): string {
  const { month, day } = localDayParts(timestamp)
  return `${month}/${day}`
}
