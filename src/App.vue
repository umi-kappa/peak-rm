<script setup lang="ts">
import { APP_VERSION } from '@/env'

const appName = 'PeakRM'
</script>

<template>
  <main class="root">
    <h1 class="title">{{ appName }}</h1>
    <p class="sub">Scaffold ready. v{{ APP_VERSION }}</p>
  </main>
</template>

<style scoped>
.root {
  min-height: 100dvh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
.sub {
  font-size: 14px;
  margin: 0;
}
</style>
