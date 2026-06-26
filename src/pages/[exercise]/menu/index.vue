<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()

// 開始すると session フローに入る。以降 training / interval / result は replace で畳み、
// メニューへ戻れないようにする（重量・メニューはトレーニング中変更不可）。
// 種目はフロー全体で URL に引き継ぐ。
function start() {
  router.replace({ name: 'training', params: { exercise: route.params.exercise } })
}
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="MENU" @back="router.push({ name: 'home' })" />
    </template>
    <p class="placeholder">menu · {{ route.params.exercise }}</p>
    <BaseButton @click="start">開始</BaseButton>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
