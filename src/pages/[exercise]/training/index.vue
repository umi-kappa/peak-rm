<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()

// session フロー内は replace で畳む（履歴を [home, 現在画面] に保ち、戻るで再入させない）。種目は URL に引き継ぐ。
function completeSet() {
  router.replace({ name: 'interval', params: { exercise: route.params.exercise } })
}
</script>

<template>
  <ScreenFrame>
    <p class="placeholder">training</p>
    <BaseButton @click="completeSet">セット完了</BaseButton>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
