import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import {
  fatalErrorInjectionKey,
  installErrorBoundary,
  useFatalError,
} from '@/composables/shared/error/useFatalError'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/tokens.css'
import '@/styles/global.css'

const app = createApp(App).use(router)

// 想定外エラーの境界。生成した store を App.vue へ provide し、4 配線を report へ集約する。
const fatalError = useFatalError()
app.provide(fatalErrorInjectionKey, fatalError)
installErrorBoundary(app, router, fatalError.report)

app.mount('#app')

// SW 登録失敗は非致命（プログレッシブエンハンスメントの劣化）。virtual:pwa-register を
// 自前 import して自動注入 registerSW.js を無効化し、reject を握って console に留める。
// エラー境界（unhandledrejection 集約）へ漏れると fatal 化するため、それを防ぐ。
registerSW({
  onRegisterError(error) {
    console.error('Service Worker registration failed', error)
  },
})
