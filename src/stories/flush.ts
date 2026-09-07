/**
 * マウント時の非同期読み込み（fake repo の即時解決 → Vue の再描画）が終わりうるだけ待つ（stories の play から使う）。
 * 経路はすべてマイクロタスクなので、マクロタスクを 1 回挟めば確実に消化される。
 * pending の fake repo は解決しないため、読み込み中の否定 assert（NO LOG が無い等）は
 * これを待ってから見ないと、読み込み中でなくても描画前で通ってしまい配線の退行を検出できない。
 */
export function flushLoad(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve))
}
