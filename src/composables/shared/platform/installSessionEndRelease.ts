import { watch } from 'vue'

import type { SessionStore } from '@/composables/shared/session/useSession'
import type { AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import type { WakeLockStore } from '@/composables/shared/platform/useWakeLock'

/**
 * 実行中セッションの終端で、開始時に取得したブラウザ副作用を巻き戻す配線
 * （spec「Wake Lock のライフサイクル」）。完了・中断・ブラウザの戻るによるフロー離脱は
 * いずれも phase 'done' に収束するため、ここ 1 箇所で 3 経路すべてを覆える。
 * 結果確認画面は履歴一覧からも開くため、その表示は契機にしない。
 *
 * 配線元の main.ts が component tree の外にあるため、生成済みのインスタンスを渡して呼ぶ
 * （`installErrorBoundary` と同じ形）。
 */
export function installSessionEndRelease(
  session: Pick<SessionStore, 'phase'>,
  wakeLock: Pick<WakeLockStore, 'release'>,
  audioCue: Pick<AudioCueStore, 'suspend'>,
) {
  watch(session.phase, (phase) => {
    if (phase !== 'done') return
    // どちらも最善努力で composable 内が失敗を握るため、完了を待たずに投げっぱなしでよい
    void wakeLock.release()
    void audioCue.suspend()
  })
}
