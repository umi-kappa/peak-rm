import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import { installErrorBoundary } from '@/composables/shared/error/installErrorBoundary'
import { fatalErrorInjectionKey, useFatalError } from '@/composables/shared/error/useFatalError'
import './styles/tokens.css'
import './styles/global.css'

const app = createApp(App).use(router)

// 想定外エラーの境界。生成した store を App.vue へ provide し、4 配線を report へ集約する。
const fatalError = useFatalError()
app.provide(fatalErrorInjectionKey, fatalError)
installErrorBoundary(app, router, fatalError.report)

app.mount('#app')
