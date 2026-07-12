/** ミリ秒を分:秒（秒は 2 桁 0 埋め・切り捨て）にする。例: 90000 → '1:30' */
export function formatClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

/** ミリ秒の秒未満をセンチ秒 2 桁（先頭ドット付き・切り捨て）にする。例: 47320 → '.32' */
export function formatCentis(ms: number): string {
  const centis = Math.floor((ms % 1000) / 10)
  return `.${String(centis).padStart(2, '0')}`
}
