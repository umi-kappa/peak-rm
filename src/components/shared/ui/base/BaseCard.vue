<script setup lang="ts">
import type { CardBorder } from '@/components/shared/ui/base/BaseCard.type'

const { border = 'soft' } = defineProps<{
  border?: CardBorder
}>()
</script>

<template>
  <div class="base-card" :class="border">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  padding: var(--space-16);
  background: var(--color-bg-light);
  border: 1px solid var(--color-line-dark);
  border-radius: var(--radius);
  color: var(--color-text);
  text-align: left;
}

.base-card.line {
  border-color: var(--color-line);
}

.base-card.accent {
  border-color: var(--color-accent);
}
</style>
