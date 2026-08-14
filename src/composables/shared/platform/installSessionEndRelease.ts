import { watch } from 'vue'

import type { FatalErrorStore } from '@/composables/shared/error/useFatalError'
import type { SessionStore } from '@/composables/shared/session/useSession'
import type { AudioCueStore } from '@/composables/shared/platform/useAudioCue'
import type { WakeLockStore } from '@/composables/shared/platform/useWakeLock'

/**
 * 実行中セッションの終端で、開始時に取得したブラウザ副作用を巻き戻す配線
 * （spec「Wake Lock のライフサイクル」）。完了・中断・ブラウザの戻るによるフロー離脱は
 * いずれも phase 'done' に収束するため、3 経路を phase の監視 1 つで覆える。
 * 結果確認画面は履歴一覧からも開くため、その表示は契機にしない。
 * fatal error だけは phase を終端させずに画面が置き換わるため、別の契機として扱う。
 *
 * 配線元の main.ts が component tree の外にあるため、生成済みのインスタンスを渡して呼ぶ
 * （`installErrorBoundary` と同じ形）。
 */
export function installSessionEndRelease(
  session: Pick<SessionStore, 'phase'>,
  fatalError: Pick<FatalErrorStore, 'error'>,
  wakeLock: Pick<WakeLockStore, 'release'>,
  audioCue: Pick<AudioCueStore, 'suspend'>,
) {
  function release() {
    // どちらも最善努力で composable 内が失敗を握るため、完了を待たずに投げっぱなしでよい
    void wakeLock.release()
    void audioCue.suspend()
  }

  watch(session.phase, (phase) => {
    if (phase !== 'done') return
    release()
  })

  // fatal error は画面遷移ではなく App.vue の RouterView 差し替えで起きるため phase が終端しない。
  // エラー画面は表示されたままでブラウザの自動 release も効かず、再読み込みまで画面が点き続ける
  watch(fatalError.error, (error) => {
    if (!error) return
    release()
  })
}
