<script setup lang="ts">
import IconButton from '@/components/shared/ui/buttons/IconButton.vue'
</script>

<template>
  <header class="brand-bar">
    <div class="text">
      <h1 class="name">PeakRM</h1>
      <span class="tagline">Train the plan. Track your peak.</span>
    </div>
    <IconButton name="settings" label="Settings" :to="{ name: 'settings' }" />
  </header>
</template>

<style scoped>
.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-8);
  padding-inline: var(--space-24);
  line-height: var(--line-height-tight);
}

.text {
  display: flex;
  align-items: baseline;
  column-gap: var(--space-8);
  flex-wrap: wrap;
  row-gap: var(--space-4);
}

.name {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}

.tagline {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-caption);
}
</style>
