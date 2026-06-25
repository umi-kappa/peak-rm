<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenFrame from '@/components/shared/ui/layout/ScreenFrame.vue'
import AppBar from '@/components/shared/ui/layout/AppBar.vue'

const router = useRouter()
</script>

<template>
  <ScreenFrame>
    <template #header>
      <AppBar title="SETTINGS" @back="router.push({ name: 'home' })" />
    </template>
    <p class="placeholder">settings</p>
  </ScreenFrame>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
