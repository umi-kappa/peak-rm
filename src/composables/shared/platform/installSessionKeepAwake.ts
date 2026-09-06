import type { FatalErrorStore } from '@/composables/shared/error/useFatalError'
import type { SessionStore } from '@/composables/shared/session/useSession'
import type { WakeLockStore } from '@/composables/shared/platform/useWakeLock'

/** 配線が使う document の面。テストは EventTarget ベースの fake を渡す */
export type VisibilityTarget = Pick<Document, 'visibilityState' | 'addEventListener'>

/**
 * 背景化でブラウザが自動解除した Wake Lock を、前景復帰時に取り直す配線
 * （spec「Wake Lock のライフサイクル」）。着信・画面ロック・他アプリへの切り替えが 1 回あると
 * sentinel は失われ、以降のインターバルは消灯して通知音も鳴らなくなるため、
 * セッションが続いている間は visible に戻るたびに acquire する（最善努力。失敗は composable が握る）。
 * fatal error 表示中は installSessionEndRelease が解除した状態を保ち、再取得しない。
 *
 * 配線元の main.ts が component tree の外にあるため、生成済みのインスタンスを渡して呼ぶ
 * （`installSessionEndRelease` と同じ形）。
 */
export function installSessionKeepAwake(
  session: Pick<SessionStore, 'phase'>,
  fatalError: Pick<FatalErrorStore, 'error'>,
  wakeLock: Pick<WakeLockStore, 'acquire'>,
  target: VisibilityTarget = document,
) {
  target.addEventListener('visibilitychange', () => {
    if (target.visibilityState !== 'visible') return
    if (session.phase.value === 'done') return
    if (fatalError.error.value) return
    void wakeLock.acquire()
  })
}
