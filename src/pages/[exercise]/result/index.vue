<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResultOrigin } from '@/router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'
import BaseButton from '@/components/shared/ui/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()

// 遷移元で戻り導線を切り替える（spec「結果確認画面」）。
// history = ヘッダー左上「←」で履歴へ / session = 下部「トレーニング終了」でホームへ。
const origin = computed<ResultOrigin>(() =>
  route.query.origin === 'history' ? 'history' : 'session',
)
</script>

<template>
  <ScreenFrame>
    <template v-if="origin === 'history'" #header>
      <AppBar title="RESULT" @back="router.back()" />
    </template>

    <p class="placeholder">result · {{ origin }}</p>

    <BaseButton v-if="origin === 'session'" @click="router.replace({ name: 'home' })">
      トレーニング終了
    </BaseButton>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
