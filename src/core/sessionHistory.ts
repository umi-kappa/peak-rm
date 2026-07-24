import { sessionMaxOneRm } from '@/core/session'
import type { Session } from '@/core/types'

/**
 * 同（ローカル日付 × 種目）ごとに 1 件へ集約する純関数。結果は startedAt 降順。
 * 採用優先順位（spec「1RM グラフ」節の集約規則。履歴一覧でも共通）:
 *   1. `executed` を `aborted` より優先（後発の中断が同日の完遂記録を消さないため）
 *   2. 同 status なら推定 1RM が最大のもの（PeakRM はピーク強度を追跡するため、最新ではなくベスト記録を採用）
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

// executed を aborted より優先 → 同 status なら推定 1RM 最大 → それも同値なら startedAt 最大。
function isHigherPriority(a: Session, b: Session): boolean {
  const aExecuted = a.status === 'executed'
  const bExecuted = b.status === 'executed'
  if (aExecuted !== bExecuted) return aExecuted
  const aOneRm = sessionMaxOneRm(a)
  const bOneRm = sessionMaxOneRm(b)
  if (aOneRm !== bOneRm) return aOneRm > bOneRm
  return a.startedAt > b.startedAt
}

/**
 * timestamp が属するローカルカレンダー日のキー。
 * 同一日の判定はデバイスのローカルタイムゾーン基準（UTC の toISOString は使わない）。
 */
export function localDayKey(timestamp: number): string {
  const d = new Date(timestamp)
  // 月は 1 始まり・ゼロ詰めし、`2026-01-09` のように整形する
  // （ソート / 表示 / 直列化に流用しても破綻しないキー形にする）。
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/**
 * timestamp が属するローカルカレンダー日の表示ラベル（`2026/01/09` 形式）。
 * localDayKey と同じ日付構成から作り、キーの内部表現（`-` 区切り）を表示層に漏らさない。
 */
export function formatLocalDay(timestamp: number): string {
  return localDayKey(timestamp).replace(/-/g, '/')
}
