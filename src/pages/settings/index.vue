<script setup lang="ts">
import { useBackNavigation } from '@/composables/shared/navigation/useBackNavigation'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'

const { goBack } = useBackNavigation()

// 足場用の仮表示。設定本体（Export / Import）は後続 Issue が肉付けする。
const version = import.meta.env.VITE_APP_VERSION
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="SETTINGS" @back="goBack" />
    </template>
    <p class="placeholder">settings</p>
    <p class="version">v{{ version }}</p>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}

.version {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}
</style>
