<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResultOrigin } from '@/router'
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()
// ← は履歴一覧から push で開かれた前提の戻り（直リンク時は履歴一覧へ逃がす）
const { goBack } = useBackNavigation({ name: 'history' })

// 遷移元で戻り導線を切り替える（spec「結果確認画面」）。
// history = ヘッダー左上「←」で履歴へ / session = 下部「トレーニング終了」でホームへ。
const origin = computed<ResultOrigin>(() =>
  route.query.origin === 'history' ? 'history' : 'session',
)

// 完了フローの終端。result を replace で畳み、戻るでフローに再入できないようにする
function finishTraining() {
  router.replace({ name: 'home' })
}
</script>

<template>
  <ScreenFrame>
    <template v-if="origin === 'history'" #header>
      <AppBar title="RESULT" @back="goBack" />
    </template>

    <p class="placeholder">result · {{ origin }}</p>

    <BaseButton v-if="origin === 'session'" @click="finishTraining"> トレーニング終了 </BaseButton>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
