<script setup lang="ts">
import { provide } from 'vue'
import { RouterView } from 'vue-router'

import { sessionInjectionKey, useSession } from '@/composables/shared/session/useSession'

// 実行中セッションの単一インスタンスを App ルートで生成し、子孫（training / interval / result）へ
// inject 用に provide する（Pinia は導入しない・規約 docs/conventions.md「状態管理」）。
provide(sessionInjectionKey, useSession())
</script>

<template>
  <RouterView />
</template>
