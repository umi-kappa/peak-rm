import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import {
  fatalErrorInjectionKey,
  installErrorBoundary,
  useFatalError,
} from '@/composables/shared/error/useFatalError'
import { registerSW } from 'virtual:pwa-register'
import { requestPersistentStorage } from '@/storage/db'
import '@/styles/tokens.css'
import '@/styles/global.css'

const app = createApp(App).use(router)

// 想定外エラーの境界。生成した store を App.vue へ provide し、4 配線を report へ集約する。
const fatalError = useFatalError()
app.provide(fatalErrorInjectionKey, fatalError)
installErrorBoundary(app, router, fatalError.report)

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
