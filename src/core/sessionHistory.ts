import type { Session } from '@/core/types'

/**
 * 同（ローカル日付 × 種目）で startedAt 最大の 1 件のみを残す純関数。
 * 結果は startedAt 降順。入力順に依存しないよう内部で降順ソートしてから集約する。
 */
export function dedupeHistoryByDayLatest(sessions: Session[]): Session[] {
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt)
  const seen = new Set<string>()
  const result: Session[] = []
  for (const session of sorted) {
    const key = `${localDayKey(session.startedAt)}:${session.exercise}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(session)
  }
  return result
}

/**
 * timestamp が属するローカルカレンダー日のキー。
 * 同一日の判定はデバイスのローカルタイムゾーン基準（UTC の toISOString は使わない）。
 */
export function localDayKey(startedAt: number): string {
  const d = new Date(startedAt)
  // 月は 1 始まり・ゼロ詰めし、`2026-01-09` のように整形する
  // （ソート / 表示 / 直列化に流用しても破綻しないキー形にする）。
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}
