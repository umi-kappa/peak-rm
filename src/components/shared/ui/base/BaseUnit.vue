<script setup lang="ts">
const { size = 'caption' } = defineProps<{ size?: 'caption' | 'body' }>()
</script>

<template>
  <span class="unit" :class="size"><slot /></span>
</template>

<style scoped>
.unit {
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-regular);
}

.unit.caption {
  font-size: var(--font-size-caption);
}
</style>
