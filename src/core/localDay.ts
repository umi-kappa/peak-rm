/**
 * timestamp が属するローカルカレンダー日の年月日。表示ラベルの共通の土台。
 * 日の切り替わりはデバイスのローカルタイムゾーン基準で判定する（UTC の toISOString は使わない）。
 * 月日をゼロ詰めするのは、表示の桁が日によって揺れないようにするため。
 */
function localDayParts(timestamp: number) {
  const d = new Date(timestamp)
  return {
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  }
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
