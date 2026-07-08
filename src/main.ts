import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/global.css'

createApp(App).use(router).mount('#app')

// SW 登録失敗は非致命（プログレッシブエンハンスメントの劣化）。virtual:pwa-register を
// 自前 import して自動注入 registerSW.js を無効化し、reject を握って console に留める。
// #59 で導入予定のエラー境界（unhandledrejection 集約）へ漏れると fatal 化するため、それを防ぐ。
registerSW({
  onRegisterError(error) {
    console.error('Service Worker registration failed', error)
  },
})
