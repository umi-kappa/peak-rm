<script setup lang="ts">
import { RouterView } from 'vue-router'

import { fatalErrorInjectionKey } from '@/composables/shared/error/useFatalError'
import { injectRequired } from '@/composables/shared/inject/injectRequired'
import ErrorScreen from '@/components/app/ErrorScreen.vue'

// main.ts（境界の 4 配線）が app.provide 済み。error は境界が報告した想定外エラーで、
// 発生後はアプリ全体をエラー画面に置き換え、事実と違う表示・記録の続行をさせない。復帰導線はページ再読み込みのみ
const { error } = injectRequired(fatalErrorInjectionKey)

// 再読み込み後は router の起動時ガード（新規ロードは常にホーム起動）でホームへ復帰する
function reload() {
  window.location.reload()
}
</script>

<template>
  <ErrorScreen v-if="error" :message="error.message" @reload="reload" />
  <RouterView v-else />
</template>
