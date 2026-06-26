<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import CardButton from '@/components/shared/ui/buttons/CardButton.vue'

const router = useRouter()

// 履歴からは push で開き、結果確認画面の戻る（←）で自然に履歴へ戻れるようにする。
// 種目は本来「開いたセッションの種目」。スタブでは代表値を渡す（後続 Issue でセッションから取る）。
function openSession() {
  router.push({ name: 'result', params: { exercise: 'benchPress' }, query: { origin: 'history' } })
}
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="HISTORY" @back="router.push({ name: 'home' })" />
    </template>
    <CardButton @click="openSession">セッションを開く</CardButton>
  </ScreenFrame>
</template>
