<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'
import ConfirmDialog from '@/components/shared/ui/dialog/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()

const abortConfirmOpen = ref(false)

function nextSet() {
  router.replace({ name: 'training', params: { exercise: route.params.exercise } })
}

// 最終セット完了・中断確定のいずれも結果確認画面へ replace で進む（session 経由）。種目は URL に引き継ぐ。
function finish() {
  router.replace({
    name: 'result',
    params: { exercise: route.params.exercise },
    query: { origin: 'session' },
  })
}

// 中断確定: ダイアログを閉じてから遷移する（開いたまま画面を破棄しない）。
function confirmAbort() {
  abortConfirmOpen.value = false
  finish()
}
</script>

<template>
  <ScreenFrame>
    <p class="placeholder">interval</p>
    <BaseButton @click="nextSet">次のセット</BaseButton>
    <BaseButton @click="finish">最終セット完了</BaseButton>
    <BaseButton variant="secondary" @click="abortConfirmOpen = true">中断</BaseButton>

    <ConfirmDialog
      :open="abortConfirmOpen"
      title="トレーニングを中断しますか？"
      message="ここまでの記録を保存して結果確認画面へ進みます。"
      confirm-label="中断する"
      @confirm="confirmAbort"
      @cancel="abortConfirmOpen = false"
    />
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
