<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <RouterView />
  </div>
</template>

<style scoped>
/* RouterView を載せるアプリ外殻。各画面の全高は ScreenFrame（100dvh）が持つため、
   ここでは高さを取り合わず、背景面と safe-area インセットだけを敷く
   （viewport-fit=cover + translucent ステータスバーのため、ノッチ・ホームインジケータを避ける）。 */
.app {
  background: var(--color-bg);
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}
</style>
