<script setup lang="ts">
import { inject } from 'vue'
import { RouterView } from 'vue-router'

import { fatalErrorInjectionKey } from '@/composables/shared/error/useFatalError'
import ErrorScreen from '@/components/app/ErrorScreen.vue'

// main.ts（境界の 4 配線）が app.provide 済み。欠落はアプリ配線のバグなので即座に失敗させる
const injected = inject(fatalErrorInjectionKey)
if (!injected) throw new Error('fatal error store is not provided')

// 境界が報告した想定外エラー。発生後はアプリ全体をエラー画面に置き換え、
// 事実と違う表示・記録の続行をさせない。復帰導線はページ再読み込みのみ
const { error } = injected

// 再読み込み後は router の起動時ガード（新規ロードは常にホーム起動）でホームへ復帰する
function reload() {
  window.location.reload()
}
</script>

<template>
  <ErrorScreen v-if="error" :message="error.message" @reload="reload" />
  <RouterView v-else />
</template>
