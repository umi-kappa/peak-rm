import { createApp } from 'vue'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import {
  fatalErrorInjectionKey,
  installErrorBoundary,
  useFatalError,
} from '@/composables/shared/error/useFatalError'
import { sessionInjectionKey, useSession } from '@/composables/shared/session/useSession'
import { audioCueInjectionKey, useAudioCue } from '@/composables/shared/platform/useAudioCue'
import { useWakeLock, wakeLockInjectionKey } from '@/composables/shared/platform/useWakeLock'
import { installSessionEndRelease } from '@/composables/shared/platform/installSessionEndRelease'
import { registerSW } from 'virtual:pwa-register'
import { requestPersistentStorage } from '@/storage/db'
import { backup, backupInjectionKey } from '@/storage/backup'
import { sessionRepo, sessionRepoInjectionKey } from '@/storage/sessionRepo'
import '@/styles/tokens.css'
import '@/styles/global.css'

// 実行中セッションの単一インスタンス。router のセッションガードとコンポーネントツリー
//（training / interval / result が inject）の両方から同じものを参照するため、ここで生成して配る
//（Pinia は導入しない・規約 docs/conventions.md「状態管理」）。
const session = useSession()
const router = createAppRouter(session)

const app = createApp(App).use(router)
app.provide(sessionInjectionKey, session)
// 画面が直接使うリポジトリも provide で配り、home / menu が inject で受ける
// （Storybook では provide decorator で fake repo に差し替える）
app.provide(sessionRepoInjectionKey, sessionRepo)
// Export / Import のデータ源。sessions テーブル単位の repo とは別に DB 全体の置換を担うため、
// sessionRepo に相乗りさせず専用の key で配る（設定画面が inject で受ける）
app.provide(backupInjectionKey, backup)

// タイマー音と画面スリープ抑止。どちらもセッションフロー全体で状態（AudioContext・sentinel）を
// 保持する必要があり、セットごとに再マウントされる画面では持てないため、ここで生成して配る。
// 取得はメニューの「開始」タップ（ユーザージェスチャ内）、解除はセッション終端の配線が担う。
const audioCue = useAudioCue()
const wakeLock = useWakeLock()
app.provide(audioCueInjectionKey, audioCue)
app.provide(wakeLockInjectionKey, wakeLock)

// 想定外エラーの境界。生成した store を App.vue へ provide し、4 配線を report へ集約する。
const fatalError = useFatalError()
app.provide(fatalErrorInjectionKey, fatalError)
installErrorBoundary(app, router, fatalError.report)

// 解除の配線は fatal error も終端として扱うため、境界の生成後に置く
installSessionEndRelease(session, fatalError, wakeLock, audioCue)

app.mount('#app')

// ITP 自動退避の抑止を最善努力で要求する（spec「ストレージ」: 拒否されても機能に影響しない縮退）。
// 拒否・例外は関数内で握って false を返すため、起動を待たせず投げっぱなしでよい。
void requestPersistentStorage()

// SW 登録失敗は非致命（プログレッシブエンハンスメントの劣化）。virtual:pwa-register を
// 自前 import して自動注入 registerSW.js を無効化し、reject を握って console に留める。
// エラー境界（unhandledrejection 集約）へ漏れると fatal 化するため、それを防ぐ。
registerSW({
  onRegisterError(error) {
    console.error('Service Worker registration failed', error)
  },
})
