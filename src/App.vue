<script setup lang="ts">
const version = import.meta.env.VITE_APP_VERSION
</script>

<template>
  <main class="root">
    <h1 class="title">PeakRM</h1>
    <p class="version">v{{ version }}</p>
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
.version {
  font-size: 14px;
  margin: 0;
}
</style>
